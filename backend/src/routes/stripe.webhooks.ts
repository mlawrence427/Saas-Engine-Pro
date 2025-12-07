// backend/src/routes/stripe.webhooks.ts
import express, { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "../lib/prisma";
import { PlanTier } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20", // or your version
});

// Middleware to get raw body for Stripe
export const stripeRawBody = express.raw({ type: "application/json" });

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).send("Missing Stripe signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      (req as any).body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("⚠️  Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        // Fail closed: require userId and customerId
        if (!userId || !customerId) {
          console.warn("checkout.session.completed: Missing userId or customerId, failing closed to FREE");
          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: { plan: PlanTier.FREE },
            });
          }
          break;
        }

        // Retrieve subscription from Stripe to get authoritative price
        let plan: PlanTier = PlanTier.FREE;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id;
          plan = mapPriceToPlan(priceId);

          // Check subscription status - only grant paid plan if active
          if (subscription.status !== "active" && subscription.status !== "trialing") {
            plan = PlanTier.FREE;
          }
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          },
        });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const subscriptionId = sub.id;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (!user) {
          console.warn(`subscription event: No user found for customerId ${customerId}`);
          break;
        }

        const priceId = sub.items.data[0]?.price?.id;

        // Fail closed: unknown or missing price → FREE
        let plan: PlanTier = mapPriceToPlan(priceId);

        // Check subscription status - downgrade if not active/trialing
        const activeStatuses: Stripe.Subscription.Status[] = ["active", "trialing"];
        if (!activeStatuses.includes(sub.status)) {
          plan = PlanTier.FREE;
        }

        // Handle cancel_at_period_end - subscription will end, downgrade now for safety
        if (sub.cancel_at_period_end) {
          plan = PlanTier.FREE;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan,
            stripeSubscriptionId: subscriptionId,
          },
        });

        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (!user) {
          console.warn(`subscription.deleted: No user found for customerId ${customerId}`);
          break;
        }

        // Subscription canceled → always downgrade to FREE
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: PlanTier.FREE,
            stripeSubscriptionId: null,
          },
        });

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string | null;

        if (!customerId) {
          console.warn("invoice.payment_failed: Missing customerId");
          break;
        }

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (!user) {
          console.warn(`invoice.payment_failed: No user found for customerId ${customerId}`);
          break;
        }

        // Payment failed → fail closed, downgrade to FREE immediately
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: PlanTier.FREE,
            stripeSubscriptionId: subscriptionId ?? user.stripeSubscriptionId,
          },
        });

        console.warn(`invoice.payment_failed: Downgraded user ${user.id} to FREE`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string | null;

        if (!customerId || !subscriptionId) {
          console.warn("invoice.payment_succeeded: Missing customerId or subscriptionId");
          break;
        }

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (!user) {
          console.warn(`invoice.payment_succeeded: No user found for customerId ${customerId}`);
          break;
        }

        // Fetch subscription from Stripe to get authoritative plan
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;

        // Fail closed: unknown price → FREE
        let plan: PlanTier = mapPriceToPlan(priceId);

        // Only reaffirm paid plan if subscription is actually active
        if (subscription.status !== "active" && subscription.status !== "trialing") {
          plan = PlanTier.FREE;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan,
            stripeSubscriptionId: subscriptionId,
          },
        });

        break;
      }

      default:
        // Unhandled events are logged but do not affect user state
        console.log(`Unhandled Stripe event type: ${event.type}`);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler error", err);
    res.status(500).send("Webhook handler error");
  }
}

// Helper: map Stripe price IDs -> PlanTier
// Fail closed: unknown or undefined price returns FREE
function mapPriceToPlan(priceId: string | undefined | null): PlanTier {
  if (!priceId) {
    console.warn("mapPriceToPlan: Missing priceId, defaulting to FREE");
    return PlanTier.FREE;
  }

  switch (priceId) {
    case process.env.STRIPE_PRICE_FREE:
      return PlanTier.FREE;
    case process.env.STRIPE_PRICE_PRO:
      return PlanTier.PRO;
    case process.env.STRIPE_PRICE_ENTERPRISE:
      return PlanTier.ENTERPRISE;
    default:
      console.warn(`mapPriceToPlan: Unknown priceId ${priceId}, defaulting to FREE`);
      return PlanTier.FREE;
  }
}
