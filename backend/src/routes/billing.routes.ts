// backend/src/routes/billing.routes.ts
import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../config/database";
import billingService from "../services/billing.service";
import { env } from "../config/env";

const router = Router();

type PlanTruthStatus =
  | "billing_not_configured"
  | "no_customer"
  | "no_subscription"
  | "unmapped_price"
  | "synced"
  | "desynced";

type StripeMode = "test" | "live" | "unknown";

function getStripeModeFromKey(key?: string | null): StripeMode {
  if (!key) return "unknown";
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return "unknown";
}

/**
 * NOTE: This is DB-only.
 * No Stripe SDK usage here.
 * Webhooks populate StripeCustomer + StripeSubscription;
 * reads compute "plan truth" from stored facts.
 */
async function computePlanTruthFromDb(userId: string) {
  const now = new Date().toISOString();
  const stripeMode = getStripeModeFromKey(env.STRIPE_SECRET_KEY ?? null);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      stripeCustomer: true,
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    return {
      internalPlan: null,
      status: "billing_not_configured" as const,
      stripe: {
        customerId: null,
        subscriptionId: null,
        subscriptionStatus: null,
        priceId: null,
        mappedPlan: null,
      },
      details: "User not found.",
      lastCheckedAt: now,
      stripeMode,
    };
  }

  // If Stripe is not configured, we still return DB-only truth.
  // This is a *read* endpoint. It must not call Stripe.
  // If you want a Stripe reconcile tool, that is a separate "wrench" endpoint.
  if (!env.STRIPE_SECRET_KEY) {
    return {
      internalPlan: user.plan ?? null,
      status: "billing_not_configured" as const,
      stripe: {
        customerId: user.stripeCustomer?.customerId ?? null,
        subscriptionId: user.subscriptions[0]?.stripeId ?? null,
        subscriptionStatus: user.subscriptions[0]?.status ?? null,
        priceId: user.subscriptions[0]?.priceId ?? null,
        mappedPlan: null,
      },
      details: "STRIPE_SECRET_KEY not configured; returning internal+DB facts only.",
      lastCheckedAt: now,
      stripeMode,
    };
  }

  if (!user.stripeCustomer) {
    return {
      internalPlan: user.plan ?? null,
      status: "no_customer" as const,
      stripe: {
        customerId: null,
        subscriptionId: null,
        subscriptionStatus: null,
        priceId: null,
        mappedPlan: null,
      },
      details: "No Stripe customer record in DB yet.",
      lastCheckedAt: now,
      stripeMode,
    };
  }

  const sub = user.subscriptions[0] ?? null;

  if (!sub) {
    return {
      internalPlan: user.plan ?? null,
      status: "no_subscription" as const,
      stripe: {
        customerId: user.stripeCustomer.customerId,
        subscriptionId: null,
        subscriptionStatus: null,
        priceId: null,
        mappedPlan: null,
      },
      details: "No subscription record in DB yet.",
      lastCheckedAt: now,
      stripeMode,
    };
  }

  // --- Price -> Plan mapping ---
  //
  // Best practice: export the mapper from billing.service.ts and reuse it here.
  // For now, we implement a deterministic mapping using env price IDs.
  //
  // IMPORTANT: Use the env var names you actually have.
  // In your env.ts snippet you had:
  //   STRIPE_PRICE_ID, STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE
  //
  // If you use different names (e.g., POWER/ELITE), update this section.
  const priceId = sub.priceId ?? null;

  const PRICE_TO_PLAN: Record<string, string> = {};
  if (env.STRIPE_PRICE_ID) PRICE_TO_PLAN[env.STRIPE_PRICE_ID] = "FREE";
  if (env.STRIPE_PRICE_PRO) PRICE_TO_PLAN[env.STRIPE_PRICE_PRO] = "PRO";
  if (env.STRIPE_PRICE_ENTERPRISE)
    PRICE_TO_PLAN[env.STRIPE_PRICE_ENTERPRISE] = "ENTERPRISE";

  const mappedPlan = priceId ? (PRICE_TO_PLAN[priceId] ?? null) : "FREE";

  if (priceId && !mappedPlan) {
    return {
      internalPlan: user.plan ?? null,
      status: "unmapped_price" as const,
      stripe: {
        customerId: user.stripeCustomer.customerId,
        subscriptionId: sub.stripeId,
        subscriptionStatus: sub.status,
        priceId,
        mappedPlan: null,
      },
      details: `Price ${priceId} not mapped to an internal plan.`,
      lastCheckedAt: now,
      stripeMode,
    };
  }

  const status: PlanTruthStatus =
    (user.plan ?? null) === mappedPlan ? "synced" : "desynced";

  return {
    internalPlan: user.plan ?? null,
    status,
    stripe: {
      customerId: user.stripeCustomer.customerId,
      subscriptionId: sub.stripeId,
      subscriptionStatus: sub.status,
      priceId,
      mappedPlan,
    },
    details:
      status === "desynced"
        ? "Internal plan does not match DB subscription mapped plan."
        : null,
    lastCheckedAt: now,
    stripeMode,
  };
}

/**
 * GET /api/billing/plan-truth
 * DB-only: compares internal plan vs DB subscription facts.
 */
router.get("/plan-truth", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    }

    const truth = await computePlanTruthFromDb(userId);
    return res.json({ success: true, data: truth });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to compute plan truth.",
    });
  }
});

/**
 * POST /api/billing/create-checkout-session
 * Explicit user action: can call Stripe (through billingService).
 */
router.post(
  "/create-checkout-session",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
      }

      const body = (req.body ?? {}) as {
        priceId?: string;
        successUrl?: string;
        cancelUrl?: string;
      };

      const base = env.FRONTEND_URL ?? "http://localhost:3000";

      const out = await billingService.createCheckoutSession({
        userId,
        priceId: body.priceId ?? billingService.getPlans()[0]?.id,
        successUrl: body.successUrl ?? `${base}/dashboard/plans?checkout=success`,
        cancelUrl: body.cancelUrl ?? `${base}/dashboard/plans?checkout=cancelled`,
      });

      return res.status(201).json({ success: true, data: out });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to create checkout session.",
      });
    }
  }
);

/**
 * POST /api/billing/sync
 * DB-only: recompute plan from stored subscription facts.
 * (No Stripe calls.)
 */
router.post("/sync", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    }

    await billingService.syncUserPlan(userId);
    const truth = await computePlanTruthFromDb(userId);

    return res.json({ success: true, data: truth });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to sync plan from DB facts.",
    });
  }
});

/**
 * GET /api/billing/info
 * Delegates to billingService (DB-only).
 */
router.get("/info", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    }

    const info = await billingService.getBillingInfo(userId);
    return res.json({ success: true, data: info });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to load billing info.",
    });
  }
});

export default router;









