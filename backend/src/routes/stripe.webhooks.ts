// src/routes/stripe.webhooks.ts
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient, SubscriptionStatus, PlanTier } from '@prisma/client';
import { config } from '../config/env';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: config.stripe.apiVersion as Stripe.LatestApiVersion,
});

const prisma = new PrismaClient();

// -----------------------------
// Helpers
// -----------------------------

function mapStripeStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'unpaid':
      return 'unpaid';
    case 'paused':
      return 'paused';
    case 'incomplete':
      return 'incomplete';
    case 'incomplete_expired':
      return 'incomplete_expired';
    default:
      return 'incomplete';
  }
}

// Strict mapping: only known price IDs become plans
const PRICE_TO_PLAN: Record<string, PlanTier> = {
  [config.stripe.priceCore]: 'FREE',        // or CORE if you rename plans later
  [config.stripe.pricePower]: 'PRO',
  [config.stripe.priceElite]: 'ENTERPRISE',
};

// -----------------------------
// Webhook handler
// -----------------------------

/**
 * Stripe webhook handler.
 *
 * Mounted in app.ts as:
 * app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler)
 */
export async function stripeWebhookHandler(
  req: Request,
  res: Response
): Promise<void> {
  const sig = req.headers['stripe-signature'];

  if (!sig || typeof sig !== 'string') {
    res.status(400).send('Missing Stripe signature');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown Stripe error';
    console.error('[stripe] Webhook signature error:', message);
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  // -----------------------------
  // ✅ Idempotency: never double-apply
  // -----------------------------
  try {
    const alreadyProcessed = await prisma.processedWebhookEvent.findUnique({
      where: { id: event.id },
    });

    if (alreadyProcessed) {
      console.log(`[stripe] Duplicate event ignored: ${event.id}`);
      res.json({ received: true, duplicate: true });
      return;
    }

    await prisma.processedWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
      },
    });
  } catch (err) {
    console.error('[stripe] Idempotency check failed:', err);
    res.status(500).send('Internal webhook idempotency error');
    return;
  }

  console.log('[stripe] Processing event:', event.type);

  // -----------------------------
  // Event handling
  // -----------------------------
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        if (!userId) {
          console.error(
            '[stripe] checkout.session.completed missing metadata.userId'
          );
          break;
        }

        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? null;

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null;

        if (!subscriptionId) {
          console.error(
            '[stripe] checkout.session.completed missing subscriptionId'
          );
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        const status = mapStripeStatus(sub.status);

        const firstItem = sub.items.data[0];
        const priceId = firstItem?.price?.id;
        let plan: PlanTier | undefined;

        if (priceId && PRICE_TO_PLAN[priceId]) {
          plan = PRICE_TO_PLAN[priceId];
        }

        console.log('[stripe] checkout.session.completed → updating user + sub', {
          userId,
          customerId,
          subscriptionId,
          status,
          priceId,
          plan,
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: customerId ?? undefined,
            plan: plan ?? undefined,
          },
        });

        await prisma.stripeSubscription.upsert({
          where: { stripeId: subscriptionId },
          update: {
            status,
            priceId: priceId ?? undefined,
            currentPeriodEnd: new Date(
              (sub.current_period_end ?? 0) * 1000
            ),
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
          },
          create: {
            stripeId: subscriptionId,
            status,
            priceId: priceId ?? undefined,
            currentPeriodEnd: new Date(
              (sub.current_period_end ?? 0) * 1000
            ),
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
            userId,
          },
        });

        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const stripeId = sub.id;

        const status = mapStripeStatus(sub.status);
        const firstItem = sub.items.data[0];
        const priceId = firstItem?.price?.id;

        console.log('[stripe] subscription change:', {
          stripeId,
          status,
          priceId,
          type: event.type,
        });

        // Update subscription record
        const updatedSub = await prisma.stripeSubscription.update({
          where: { stripeId },
          data: {
            status,
            priceId: priceId ?? undefined,
            currentPeriodEnd: new Date(
              (sub.current_period_end ?? 0) * 1000
            ),
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
          },
        });

        // If subscription is deleted or fully canceled → downgrade user to FREE
        if (event.type === 'customer.subscription.deleted') {
          await prisma.user.update({
            where: { id: updatedSub.userId },
            data: {
              plan: 'FREE',
            },
          });
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[stripe] invoice.payment_succeeded:', {
          id: invoice.id,
          customer: invoice.customer,
          subscription: invoice.subscription,
        });
        // In many setups, subscription status is updated via customer.subscription.updated,
        // so we just log here for now.
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn('[stripe] invoice.payment_failed:', {
          id: invoice.id,
          customer: invoice.customer,
          subscription: invoice.subscription,
        });
        // Subscription status will typically become past_due/unpaid
        // and be handled by customer.subscription.updated.
        break;
      }

      default: {
        console.log('[stripe] Unhandled event type:', event.type);
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[stripe] Webhook handler error:', err);
    res.status(500).send('Webhook handler error');
  }
}



