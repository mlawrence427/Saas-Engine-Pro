// backend/src/services/billing.service.ts
// Stripe billing sync (webhook-driven) + DB-plan reconciliation
//
// Philosophy:
// - Stripe webhooks WRITE facts into DB.
// - Reads compute plan truth at request time.
// - No enforcement beyond emitting/returning state.

import Stripe from "stripe";
import { PlanTier, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { config } from "../config/env";
import { logger } from "../utils/logger";

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: config.stripe.apiVersion as Stripe.LatestApiVersion,
});

const webhookSecret = config.stripe.webhookSecret;

// Convenience aliases (optional strings; may be empty)
const PRICE_DEFAULT = config.stripe.prices.default || "";
const PRICE_PRO = config.stripe.prices.pro || "";
const PRICE_ENTERPRISE = config.stripe.prices.enterprise || "";

/**
 * Map Stripe price ID -> internal PlanTier.
 * If an unknown paid price appears, we default to PRO (conservative "paid" behavior).
 * If no price is present, default to FREE.
 */
function mapPriceIdToPlan(priceId: string | undefined | null): PlanTier {
  if (!priceId) return "FREE";

  if (PRICE_DEFAULT && priceId === PRICE_DEFAULT) return "FREE";
  if (PRICE_PRO && priceId === PRICE_PRO) return "PRO";
  if (PRICE_ENTERPRISE && priceId === PRICE_ENTERPRISE) return "ENTERPRISE";

  // Unknown price: treat as paid unless you want fail-closed to FREE
  return "PRO";
}

function isActiveStatus(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing";
}

/**
 * Compute the effective plan for a user based on DB subscription facts only.
 * - If any active/trialing subscription exists → plan derived from that subscription priceId
 * - Else → FREE
 */
async function recomputeEffectivePlanForUser(userId: string): Promise<PlanTier> {
  const activeSub = await prisma.stripeSubscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!activeSub) return "FREE";
  return mapPriceIdToPlan(activeSub.priceId ?? undefined);
}

/**
 * Resolve the internal userId for a Stripe subscription.
 * Prefer subscription.metadata.userId, fallback to StripeCustomer table via customerId.
 */
async function resolveUserIdForSubscription(
  subscription: Stripe.Subscription
): Promise<string | null> {
  const metaUserId = subscription.metadata?.userId;
  if (metaUserId) return metaUserId;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) {
    logger.error("Subscription has no customer ID", {
      subscriptionId: subscription.id,
    });
    return null;
  }

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { customerId },
  });

  if (stripeCustomer?.userId) {
    logger.info("Recovered userId from StripeCustomer", {
      subscriptionId: subscription.id,
      customerId,
      userId: stripeCustomer.userId,
    });
    return stripeCustomer.userId;
  }

  return null;
}

function extractSubscriptionPriceId(subscription: Stripe.Subscription): string | null {
  // We assume single-plan subscription. If you later support multi-items, define a rule.
  const item = subscription.items.data[0];
  return item?.price?.id ?? null;
}

/**
 * Upsert subscription in DB + update user's effective plan atomically.
 */
async function syncSubscriptionToDb(subscription: Stripe.Subscription) {
  const userId = await resolveUserIdForSubscription(subscription);

  if (!userId) {
    logger.error("CRITICAL: Cannot sync subscription - userId not found", {
      subscriptionId: subscription.id,
      status: subscription.status,
      customer: subscription.customer,
      metadata: subscription.metadata,
    });
    // Throw so Stripe retries webhook delivery
    throw new Error(`Cannot sync subscription ${subscription.id}: userId not found`);
  }

  const priceId = extractSubscriptionPriceId(subscription);
  const mappedPlan = mapPriceIdToPlan(priceId ?? undefined);

  const status = subscription.status as SubscriptionStatus;
  const active = isActiveStatus(status);

  // Deterministic: active/trialing -> mapped plan, else FREE
  const effectivePlan: PlanTier = active ? mappedPlan : "FREE";

  await prisma.$transaction([
    prisma.stripeSubscription.upsert({
      where: { stripeId: subscription.id },
      create: {
        stripeId: subscription.id,
        userId,
        status,
        priceId,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        status,
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
        action: active ? "PLAN_UPGRADED" : "PLAN_DOWNGRADED",
        entityType: "SUBSCRIPTION",
        entityId: subscription.id,
        performedByUserId: null,
        metadata: {
          userId,
          subscriptionId: subscription.id,
          status,
          priceId,
          effectivePlan,
        },
      },
    }),
  ]);

  logger.info("Subscription synced", {
    subscriptionId: subscription.id,
    userId,
    status,
    priceId,
    effectivePlan,
  });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const stripeSubscriptionId = session.subscription as string | null;

  if (!userId || !stripeSubscriptionId) {
    logger.warn("Checkout session missing metadata", {
      sessionId: session.id,
      hasUserId: !!userId,
      hasSubscriptionId: !!stripeSubscriptionId,
    });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  await syncSubscriptionToDb(subscription);

  logger.info("Checkout completed and subscription synced", {
    userId,
    subscriptionId: stripeSubscriptionId,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) {
    logger.warn("Payment failed invoice has no customer", { invoiceId: invoice.id });
    return;
  }

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { customerId },
  });

  if (!stripeCustomer) {
    logger.warn("Payment failed for unknown customer", {
      customerId,
      invoiceId: invoice.id,
    });
    return;
  }

  logger.warn("Payment failed", {
    userId: stripeCustomer.userId,
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
    attemptCount: invoice.attempt_count,
  });

  // The subscription.updated webhook will handle any eventual status change -> plan update.
}

async function ensureStripeCustomerForUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { stripeCustomer: true },
  });

  if (!user) throw new Error("User not found");

  if (user.stripeCustomer?.customerId) return user.stripeCustomer.customerId;

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId },
  });

  // Persist mapping
  await prisma.stripeCustomer.create({
    data: {
      userId,
      customerId: customer.id,
    },
  });

  return customer.id;
}

function isPrismaUniqueViolation(err: unknown): boolean {
  // Prisma: P2002 = Unique constraint failed
  return typeof err === "object" && err !== null && (err as any).code === "P2002";
}

const billingService = {
  /**
   * Plans shown to the frontend.
   * This is “display data” for demo flows.
   *
   * If price IDs are not configured, we still return a safe stub.
   */
  getPlans() {
    // Note: you can expand this later if you want multiple tiers visible in the UI.
    return [
      {
        id: PRICE_PRO || "price_not_configured",
        name: "SaaS Engine",
        priceMonthly: 1999,
        currency: "usd",
        interval: "month",
      },
    ];
  },

  async getBillingInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stripeCustomer: true,
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const subscription = user?.subscriptions[0] ?? null;

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

  /**
   * Create Stripe Checkout session (subscription mode).
   * Requires STRIPE_SECRET_KEY to be valid.
   */
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
    const stripeCustomerId = await ensureStripeCustomerForUser(userId);

    if (!priceId || priceId === "price_not_configured") {
      throw new Error(
        "Stripe priceId not configured. Set STRIPE_PRICE_PRO (or pass a real priceId)."
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
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

  async createPortalSession(userId: string, returnUrl: string) {
    const customer = await prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    if (!customer) throw new Error("Stripe customer not found");

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.customerId,
      return_url: returnUrl,
    });

    return { url: portal.url };
  },

  /**
   * Stripe webhook entrypoint.
   * - verifies signature
   * - idempotency via ProcessedWebhookEvent (safe under concurrency)
   * - syncs subscription facts into DB
   */
  async handleWebhook(payload: Buffer, signature: string) {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    logger.info(`Processing webhook: ${event.type}`, { eventId: event.id });

    // ---- Idempotency (concurrency-safe) ----
    // Create the idempotency marker FIRST.
    // If another worker already created it, we treat as duplicate and return.
    try {
      await prisma.processedWebhookEvent.create({
        data: { id: event.id, type: event.type },
      });
    } catch (err) {
      if (isPrismaUniqueViolation(err)) {
        logger.info("Webhook already processed, skipping", { eventId: event.id });
        return { received: true, duplicate: true };
      }
      throw err;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session
          );
          break;

        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await syncSubscriptionToDb(event.data.object as Stripe.Subscription);
          break;

        case "invoice.payment_failed":
          await handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          // No-op for events we don't care about
          break;
      }

      logger.info("Webhook processed successfully", {
        eventId: event.id,
        type: event.type,
      });
    } catch (error) {
      logger.error("Webhook processing failed", {
        eventId: event.id,
        type: event.type,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // IMPORTANT: remove marker so Stripe retry can re-run successfully.
      // (If you later add a status column, you can keep and mark failed.)
      try {
        await prisma.processedWebhookEvent.delete({ where: { id: event.id } });
      } catch (cleanupErr) {
        logger.error("Failed to cleanup idempotency marker after webhook failure", {
          eventId: event.id,
          error:
            cleanupErr instanceof Error ? cleanupErr.message : "Unknown cleanup error",
        });
      }

      throw error;
    }

    return { received: true };
  },

  /**
   * Manual recompute from DB facts only.
   * This does NOT call Stripe. It's deterministic based on stored subscriptions.
   */
  async syncUserPlan(userId: string): Promise<PlanTier> {
    const plan = await recomputeEffectivePlanForUser(userId);

    await prisma.user.update({
      where: { id: userId },
      data: { plan },
    });

    logger.info("Manual plan recompute from DB facts", {
      userId,
      effectivePlan: plan,
    });

    return plan;
  },
};

export default billingService;
export { billingService };




