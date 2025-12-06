import express, { Request, Response } from "express";
import Stripe from "stripe";
import { PrismaClient, SubscriptionStatus } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27.acacia", // or your Stripe API version
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  "/stripe",
  // IMPORTANT: raw body for Stripe signature verification
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string | undefined;

    if (!webhookSecret) {
      console.error("[stripe] Missing STRIPE_WEBHOOK_SECRET");
      return res.status(500).send("Webhook not configured");
    }

    if (!sig) {
      console.error("[stripe] Missing Stripe signature header");
      return res.status(400).send("Missing signature");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error("[stripe] Webhook signature verification failed:", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[stripe] Received event: ${event.type}`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          const userId = session.metadata?.userId;
          if (!userId) {
            console.error(
              "[stripe] checkout.session.completed without metadata.userId"
            );
            break;
          }

          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id ?? null;

          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id ?? null;

          // Fetch subscription from Stripe to get status + price
          let plan: string | null = null;
          let subscriptionStatus: SubscriptionStatus = "INACTIVE";

          if (subscriptionId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);

            // Map Stripe status -> our enum
            // Adjust to match your Prisma enum values exactly
            switch (sub.status) {
              case "active":
              case "trialing":
                subscriptionStatus = "ACTIVE";
                break;
              case "past_due":
                subscriptionStatus = "PAST_DUE" as SubscriptionStatus;
                break;
              case "canceled":
              case "unpaid":
                subscriptionStatus = "CANCELED";
                break;
              default:
                subscriptionStatus = "INACTIVE";
            }

            const firstItem = sub.items.data[0];
            const priceId = firstItem?.price?.id ?? null;

            // Map price IDs to internal plan identifiers
            if (
              priceId &&
              priceId === process.env.STRIPE_DEFAULT_PRICE_ID
            ) {
              plan = "PRO";
            } else if (priceId) {
              plan = priceId; // fallback: store raw price id
            }
          }

          console.log("[stripe] Updating user subscription:", {
            userId,
            customerId,
            subscriptionId,
            plan,
            subscriptionStatus,
          });

          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: customerId ?? undefined,
              stripeSubscriptionId: subscriptionId ?? undefined,
              plan: plan ?? undefined,
              subscriptionStatus,
            },
          });

          break;
        }

        // You can extend later:
        // case "customer.subscription.updated":
        // case "customer.subscription.deleted":
        //   ...

        default:
          // For now, just log everything else
          console.log("[stripe] Unhandled event type:", event.type);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("[stripe] Error handling event:", err);
      res.status(500).send("Webhook handler error");
    }
  }
);

export default router;





