// backend/src/api/billing/billing.routes.ts

import { Router, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../../utils/prisma";
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

// Use env for your main subscription price
const DEFAULT_PRICE_ID = process.env.STRIPE_PRICE_ID_PRO as string;

// POST /api/billing/create-checkout-session
router.post(
  "/create-checkout-session",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      if (!DEFAULT_PRICE_ID) {
        console.error("Missing STRIPE_PRICE_ID_PRO in env");
        return res.status(500).json({ error: "Billing is not configured" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Ensure Stripe customer
      let stripeCustomerId = user.stripeCustomerId ?? undefined;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name ?? undefined,
          metadata: {
            userId: user.id,
          },
        });

        stripeCustomerId = customer.id;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeCustomerId: customer.id,
          },
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomerId,
        line_items: [
          {
            price: DEFAULT_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/billing?canceled=1`,
        client_reference_id: user.id,
        metadata: {
          userId: user.id,
          priceId: DEFAULT_PRICE_ID,
        },
      });

      return res.json({ url: session.url });
    } catch (err) {
      console.error("Error creating checkout session:", err);
      return res.status(500).json({ error: "Failed to create checkout session" });
    }
  }
);

export default router;

