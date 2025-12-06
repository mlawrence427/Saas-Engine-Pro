import Stripe from "stripe";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const defaultPriceId = process.env.STRIPE_PRICE_ID!;

export const billingService = {
  // ==========================
  // ✅ PLANS
  // ==========================
  getPlans() {
    return [
      {
        id: defaultPriceId,
        name: "SaaS Engine Pro",
        priceMonthly: 1999,
        currency: "usd",
        interval: "month",
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
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
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

    if (!user) throw new Error("User not found");

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

  // ==========================
  // ✅ CUSTOMER PORTAL
  // ==========================
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

  // ==========================
  // ✅ WEBHOOK HANDLER
  // ==========================
  async handleWebhook(payload: Buffer, signature: string) {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    logger.info(`Processing webhook: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(
          event.data.object as Stripe.Subscription
        );
        break;
    }

    return { received: true };
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
  const stripeSubscriptionId = session.subscription as string;

  if (!userId || !stripeSubscriptionId) return;

  const subscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  await syncSubscription(subscription);

  logger.info("✅ Checkout completed and subscription synced");
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const priceId = subscription.items.data[0]?.price.id;

  await prisma.stripeSubscription.upsert({
    where: { stripeId: subscription.id },
    create: {
      stripeId: subscription.id,
      userId,
      status: subscription.status,
      priceId: priceId!,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    update: {
      status: subscription.status,
      priceId: priceId!,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  logger.info("✅ Subscription upserted", {
    subscriptionId: subscription.id,
    status: subscription.status,
  });
}
