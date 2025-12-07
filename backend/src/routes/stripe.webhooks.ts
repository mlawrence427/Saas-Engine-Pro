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

        // We assume you stored userId in metadata when you created the session
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId || session.line_items?.data[0]?.price?.id;

        if (!userId || !priceId) break;

        const plan = mapPriceToPlan(priceId);
        if (!plan) break;

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeCustomerId: session.customer as string,
          },
        });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        // Load user by customer id
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!user) break;

        const priceId =
          (sub.items.data[0]?.price?.id as string | undefined) ?? null;
        if (!priceId) break;

        const plan = mapPriceToPlan(priceId);
        if (!plan) break;

        await prisma.user.update({
          where: { id: user.id },
          data: { plan },
        });

        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!user) break;

        // downgrade to FREE
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: PlanTier.FREE },
        });

        break;
      }

      default:
        // ignore other events for now
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler error", err);
    res.status(500).send("Webhook handler error");
  }
}

// Helper: map Stripe price IDs -> PlanTier
function mapPriceToPlan(priceId: string): PlanTier | null {
  switch (priceId) {
    case process.env.STRIPE_PRICE_FREE!:
      return PlanTier.FREE;
    case process.env.STRIPE_PRICE_PRO!:
      return PlanTier.PRO;
    case process.env.STRIPE_PRICE_ENTERPRISE!:
      return PlanTier.ENTERPRISE;
    default:
      console.warn("Unknown price id in webhook:", priceId);
      return null;
  }
}
