// src/services/billing.service.ts - PRODUCTION FIXED & CONSISTENT

import Stripe from 'stripe';
import { PlanTier } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { config } from '../config/env';

// Use the same Stripe config as the rest of the app
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: config.stripe.apiVersion as Stripe.LatestApiVersion,
});

const webhookSecret = config.stripe.webhookSecret;

// Default price we show in "plans" (use POWER = PRO plan)
const defaultPriceId = config.stripe.pricePower;

// ==========================
// Plan / price helpers
// ==========================

// Map a Stripe price ID to an internal PlanTier.
// These MUST match your .env / config.env:
//
//   STRIPE_PRICE_CORE   -> config.stripe.priceCore
//   STRIPE_PRICE_POWER  -> config.stripe.pricePower
//   STRIPE_PRICE_ELITE  -> config.stripe.priceElite
//
const PRICE_TO_PLAN: Record<string, PlanTier> = {
  [config.stripe.priceCore]: 'FREE',       // or CORE if you rename plans later
  [config.stripe.pricePower]: 'PRO',
  [config.stripe.priceElite]: 'ENTERPRISE',
};

function mapPriceIdToPlan(priceId: string | undefined | null): PlanTier {
  if (!priceId) return 'FREE';
  return PRICE_TO_PLAN[priceId] ?? 'PRO'; // unknown paid price → PRO by default
}

/**
 * Recompute the *effective* plan for a user based on ALL their subscriptions.
 * - If any subscription is active/trialing → plan from that subscription
 * - Otherwise → FREE
 */
async function recomputeEffectivePlanForUser(
  userId: string
): Promise<PlanTier> {
  const activeSubscription = await prisma.stripeSubscription.findFirst({
    where: {
      userId,
      status: { in: ['active', 'trialing'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!activeSubscription) {
    return 'FREE';
  }

  return mapPriceIdToPlan(activeSubscription.priceId ?? undefined);
}

export const billingService = {
  // ==========================
  // ✅ PLANS
  // ==========================
  getPlans() {
    return [
      {
        id: defaultPriceId,
        name: 'SaaS Engine Pro',
        priceMonthly: 1999, // $19.99 or $1999 cents – adjust to your pricing
        currency: 'usd',
        interval: 'month',
      },
    ];
  },

  // ==========================
  // ✅ BILLING INFO
  // ==========================
  async getBillingInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stripeCustomer: true,
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const subscription = user?.subscriptions[0];

    return {
      hasStripeCustomer: !!user?.stripeCustomer,
      subscription: subscription
        ? {
            status: subscription.status,
            priceId: subscription.priceId,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
    };
  },

  // ==========================
  // ✅ CREATE CHECKOUT
  // ==========================
  async createCheckoutSession({
    userId,
    priceId,
    successUrl,
    cancelUrl,
  }: {
    userId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stripeCustomer: true },
    });

    if (!user) throw new Error('User not found');

    let stripeCustomerId = user.stripeCustomer?.customerId;

    // ✅ Create Stripe customer if missing
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });

      await prisma.stripeCustomer.create({
        data: {
          userId,
          customerId: customer.id,
        },
      });

      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, priceId },
      subscription_data: {
        metadata: { userId },
      },
      allow_promotion_codes: true,
    });

    return { id: session.id, url: session.url };
  },

  // ==========================
  // ✅ CUSTOMER PORTAL
  // ==========================
  async createPortalSession(userId: string, returnUrl: string) {
    const customer = await prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    if (!customer) throw new Error('Stripe customer not found');

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.customerId,
      return_url: returnUrl,
    });

    return { url: portal.url };
  },

  // ==========================
  // ✅ WEBHOOK HANDLER (SINGLE SOURCE OF TRUTH)
  // ==========================
  async handleWebhook(payload: Buffer, signature: string) {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    logger.info(`Processing webhook: ${event.type}`, { eventId: event.id });

    // ✅ Idempotency: skip already processed events
    const existingEvent = await prisma.processedWebhookEvent.findUnique({
      where: { id: event.id },
    });

    if (existingEvent) {
      logger.info('Webhook already processed, skipping', {
        eventId: event.id,
      });
      return { received: true, duplicate: true };
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session
          );
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await syncSubscription(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        // You can add more cases as needed
      }

      // ✅ Mark event as processed AFTER successful handling
      await prisma.processedWebhookEvent.create({
        data: { id: event.id, type: event.type },
      });

      logger.info('Webhook processed successfully', {
        eventId: event.id,
        type: event.type,
      });
    } catch (error) {
      logger.error('Webhook processing failed', {
        eventId: event.id,
        type: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Re-throw to trigger Stripe retry
      throw error;
    }

    return { received: true };
  },

  // ==========================
  // ✅ MANUAL PLAN SYNC (for /api/billing/sync)
  // ==========================
  async syncUserPlan(userId: string): Promise<PlanTier> {
    const plan = await recomputeEffectivePlanForUser(userId);

    await prisma.user.update({
      where: { id: userId },
      data: { plan },
    });

    logger.info('Manual subscription sync triggered', {
      userId,
      effectivePlan: plan,
    });

    return plan;
  },
};

export default billingService;

// ======================================================
// ✅ HELPERS
// ======================================================

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const stripeSubscriptionId = session.subscription as string | null;

  if (!userId || !stripeSubscriptionId) {
    logger.warn('Checkout session missing metadata', {
      sessionId: session.id,
      hasUserId: !!userId,
      hasSubscriptionId: !!stripeSubscriptionId,
    });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    stripeSubscriptionId
  );
  await syncSubscription(subscription);

  logger.info('✅ Checkout completed and subscription synced', {
    userId,
    subscriptionId: stripeSubscriptionId,
  });
}

// ✅ Resolve userId from subscription with fallback to customer lookup
async function resolveUserId(
  subscription: Stripe.Subscription
): Promise<string | null> {
  // Try metadata first
  const userId = subscription.metadata?.userId;
  if (userId) return userId;

  // Fallback - lookup by Stripe customer ID
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) {
    logger.error('🚨 Subscription has no customer ID', {
      subscriptionId: subscription.id,
    });
    return null;
  }

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { customerId },
  });

  if (stripeCustomer) {
    logger.info('Recovered userId from StripeCustomer table', {
      subscriptionId: subscription.id,
      customerId,
      userId: stripeCustomer.userId,
    });
    return stripeCustomer.userId;
  }

  return null;
}

// ✅ Main sync function with proper User.plan update
async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = await resolveUserId(subscription);

  if (!userId) {
    // Log critical error instead of silent failure
    logger.error('🚨 CRITICAL: Cannot sync subscription - userId not found', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      metadata: subscription.metadata,
    });
    // Throw to trigger webhook retry - Stripe will retry up to ~3 days
    throw new Error(
      `Cannot sync subscription ${subscription.id}: userId not found`
    );
  }

  const priceId = subscription.items.data[0]?.price.id ?? null;
  const plan = mapPriceIdToPlan(priceId);

  // Determine plan based on subscription status
  const isActivePlan = ['active', 'trialing'].includes(subscription.status);
  const effectivePlan: PlanTier = isActivePlan ? plan : 'FREE';

  // Update BOTH StripeSubscription AND User.plan atomically
  await prisma.$transaction([
    prisma.stripeSubscription.upsert({
      where: { stripeId: subscription.id },
      create: {
        stripeId: subscription.id,
        userId,
        status: subscription.status,
        priceId,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        status: subscription.status,
        priceId,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    }),

    prisma.user.update({
      where: { id: userId },
      data: { plan: effectivePlan },
    }),

    prisma.auditLog.create({
      data: {
        action: isActivePlan ? 'PLAN_UPGRADED' : 'PLAN_DOWNGRADED',
        entityType: 'SUBSCRIPTION',
        entityId: subscription.id,
        performedByUserId: null, // System action
        metadata: {
          userId,
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId,
          effectivePlan,
          previousPlan: null, // could fetch if needed
        },
      },
    }),
  ]);

  logger.info('✅ Subscription and user plan synced', {
    subscriptionId: subscription.id,
    userId,
    status: subscription.status,
    priceId,
    effectivePlan,
  });
}

// ✅ Handle failed payments
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) {
    logger.warn('Payment failed invoice has no customer', {
      invoiceId: invoice.id,
    });
    return;
  }

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { customerId },
  });

  if (!stripeCustomer) {
    logger.warn('Payment failed for unknown customer', {
      customerId,
      invoiceId: invoice.id,
    });
    return;
  }

  logger.warn('💳 Payment failed', {
    userId: stripeCustomer.userId,
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
    attemptCount: invoice.attempt_count,
  });

  // Optional: send notification, update UI state, etc.
  // The subscription.updated webhook will handle plan downgrade when status changes
}


