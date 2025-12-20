// src/routes/stripe.webhooks.ts
import express, { type Request, type Response } from "express";
import billingService from "../services/billing.service";

const router = express.Router();

/**
 * POST /api/webhooks/stripe
 *
 * IMPORTANT:
 * - Mounted BEFORE express.json() in app.ts
 * - Uses express.raw() so Stripe signature verification works
 * - This route is NOT authenticated
 * - Failures return non-2xx so Stripe retries
 */
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      res.status(400).send("Missing Stripe signature");
      return;
    }

    try {
      // req.body is a Buffer due to express.raw()
      const result = await billingService.handleWebhook(
        req.body as Buffer,
        signature
      );

      // Deterministic acknowledgement
      res.json(result);
    } catch (err) {
      console.error("[stripe] webhook error:", err);
      // Non-2xx causes Stripe retry (desired)
      res.status(400).send("Webhook handler error");
    }
  }
);

export default router;





