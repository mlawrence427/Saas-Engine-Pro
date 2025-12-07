// backend/src/routes/billing.routes.ts

import { Router, Request, Response } from "express";

const router = Router();

/**
 * Temporary placeholder billing routes.
 * This keeps the server running while we finalize the new billing flow.
 * You can extend these later to call your real Stripe billing service.
 */

// Simple sanity endpoint so you can verify routing
router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", scope: "billing" });
});

// Placeholder for checkout session creation
router.post("/create-checkout-session", (_req: Request, res: Response) => {
  return res.status(501).json({
    error: "create-checkout-session not implemented yet in new billing.routes",
  });
});

// Placeholder for billing portal session
router.post("/create-portal-session", (_req: Request, res: Response) => {
  return res.status(501).json({
    error: "create-portal-session not implemented yet in new billing.routes",
  });
});

export default router;
