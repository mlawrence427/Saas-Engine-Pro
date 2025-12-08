// src/routes/stripe.webhooks.ts
import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient, SubscriptionStatus, PlanTier } from '@prisma/client';
import { config } from '../config/env';

const router = express.Router();
const prisma = new PrismaClient();

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: config.stripe.apiVersion as Stripe.LatestApiVersion,
});

// ✅ STRICT PRICE → PLAN MAP (NO PHANTOM TIERS)
const PRICE_TO_PLAN: Record<string, PlanTier> = {
  [config.stripe.priceCore]: 'FREE',
  [config.stripe.pricePower]: 'PRO',
  [config.stripe.priceElite]: 'ENTERPRISE',
};

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (!sig || typeof sig !== 'string') {
      return res.status(400).send('Missing Stripe signature');
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
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    // =========================================================
    // ✅ IDEMPOTENCY (HARD BLOCK DUPLICATES)
    // =========================================================

    const alreadyProcessed = await prisma.processedWebhookEvent.findUnique({
      where: { id: event.id },
    });

    if (alreadyProcessed) {
      console.log(`[stripe] Duplicate event ignored: ${event.id}`);
      return res.json({ received: true, duplicate: true });
    }

    await prisma.processedWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
      },
    });

    // =========================================================
    // ✅ EVENT HANDLING
    // =========================================================

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          const userId = session.metadata?.userId;
          if (!userId) break;

          const customerId =
            typeof session.customer === 'string'
              ? session.customer
              : session.customer?.id ?? null;

          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id ?? null;

          if (!subscriptionId) break;

          const sub = await stripe.subscriptions.retrieve(subscriptionId);

          // ✅ ENUM-SAFE STATUS MAPPING
          let subscriptionStatus: SubscriptionStatus = 'incomplete';

          switch (sub.status) {
            case 'active':
              subscriptionStatus = 'active';
              break;
            case 'trialing':
              subscriptionStatus = 'trialing';
              break;
            case 'past_due':
              subscriptionStatus = 'past_due';
              break;
            case 'canceled':
              subscriptionStatus = 'canceled';
              break;
            case 'unpaid':
              subscriptionStatus = 'unpaid';
              break;
            case 'paused':
              subscriptionStatus = 'paused';
              break;
            case 'incomplete':
              subscriptionStatus = 'incomplete';
              break;
            case 'incomplete_expired':
              subscriptionStatus = 'incomplete_expired';
              break;
            default:
              subscriptionStatus = 'incomplete';
          }

          const firstItem = sub.items.data[0];
          const priceId = firstItem?.price?.id;

          let plan: PlanTier | undefined;
          if (priceId && PRICE_TO_PLAN[priceId]) {
            plan = PRICE_TO_PLAN[priceId];
          }

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
              status: subscriptionStatus,
              priceId: priceId ?? undefined,
              currentPeriodEnd: new Date(
                (sub.current_period_end ?? 0) * 1000
              ),
              cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
            },
            create: {
              stripeId: subscriptionId,
              status: subscriptionStatus,
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

          let subscriptionStatus: SubscriptionStatus = 'incomplete';

          switch (sub.status) {
            case 'active':
              subscriptionStatus = 'active';
              break;
            case 'trialing':
              subscriptionStatus = 'trialing';
              break;
            case 'past_due':
              subscriptionStatus = 'past_due';
              break;
            case 'canceled':
              subscriptionStatus = 'canceled';
              break;
            case 'unpaid':
              subscriptionStatus = 'unpaid';
              break;
            case 'paused':
              subscriptionStatus = 'paused';
              break;
            case 'incomplete':
              subscriptionStatus = 'incomplete';
              break;
            case 'incomplete_expired':
              subscriptionStatus = 'incomplete_expired';
              break;
            default:
              subscriptionStatus = 'incomplete';
          }

          const firstItem = sub.items.data[0];
          const priceId = firstItem?.price?.id;

          await prisma.stripeSubscription.update({
            where: { stripeId },
            data: {
              status: subscriptionStatus,
              priceId: priceId ?? undefined,
              currentPeriodEnd: new Date(
                (sub.current_period_end ?? 0) * 1000
              ),
              cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
            },
          });

          if (event.type === 'customer.subscription.deleted') {
            const existing = await prisma.stripeSubscription.findUnique({
              where: { stripeId },
            });

            if (existing) {
              await prisma.user.update({
                where: { id: existing.userId },
                data: {
                  plan: 'FREE',
                },
              });
            }
          }

          break;
        }

        default:
          break;
      }

      res.json({ received: true });
    } catch (err) {
      console.error('[stripe] Handler error:', err);
      res.status(500).send('Webhook handler error');
    }
  }
);

export default router;


