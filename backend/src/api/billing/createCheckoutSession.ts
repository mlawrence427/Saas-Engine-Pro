import type { Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27.acacia", // or the version you're using
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export const createCheckoutSession = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const priceId = process.env.STRIPE_DEFAULT_PRICE_ID;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    if (!priceId) {
      console.error("[billing] Missing STRIPE_DEFAULT_PRICE_ID");
      return res
        .status(500)
        .json({ error: "Billing is not configured correctly." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      // Where to send users after success/cancel
      success_url: `${frontendUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/dashboard?checkout=canceled`,

      // This is the key part for webhook linking:
      metadata: {
        userId, // used in checkout.session.completed webhook
      },

      // Optional, but nice: pre-fill email
      customer_email: req.user.email,
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[billing] Error creating checkout session:", err);
    return res.status(500).json({ error: "Failed to create checkout session." });
  }
};
