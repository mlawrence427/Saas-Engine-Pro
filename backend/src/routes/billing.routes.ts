// backend/src/routes/billing.routes.ts

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import type { User } from '@prisma/client';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * Stripe & plan configuration from process.env
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || undefined;

const STRIPE_PRICE_FREE = process.env.STRIPE_PRICE_FREE || null;
const STRIPE_PRICE_PRO_MONTHLY = process.env.STRIPE_PRICE_PRO_MONTHLY || null;
const STRIPE_PRICE_ENTERPRISE_MONTHLY =
  process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || null;

// Frontend base URL for Checkout redirect fallbacks
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  process.env.APP_BASE_URL ||
  'http://localhost:3000';

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  : null;

type StripeMode = 'test' | 'live' | 'unknown';

function getStripeMode(): StripeMode {
  if (!STRIPE_SECRET_KEY) return 'unknown';
  if (STRIPE_SECRET_KEY.startsWith('sk_test_')) return 'test';
  if (STRIPE_SECRET_KEY.startsWith('sk_live_')) return 'live';
  return 'unknown';
}

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    email?: string;
    plan?: string | null;
    stripeCustomerId?: string | null;
    role?: string | null;
  };
}

type PlanTruthStatus =
  | 'stripe_not_configured'
  | 'no_customer_id'
  | 'no_active_subscription'
  | 'unmapped_price'
  | 'synced'
  | 'desynced'
  | 'stripe_error';

interface PlanTruthStripeInfo {
  customerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  priceId: string | null;
  mappedPlan: string | null;
}

export interface PlanTruthPayload {
  internalPlan: string | null;
  status: PlanTruthStatus;
  stripe: PlanTruthStripeInfo;
  details?: string | null;
  lastCheckedAt: string; // ISO string
  stripeMode: StripeMode;
}

/**
 * Lightweight in-memory billing event buffer.
 * This is demo-focused and can later be replaced with a Prisma model.
 */

type BillingEventSource = 'local' | 'stripe_webhook';

interface BillingEvent {
  id: string;
  createdAt: string;
  type: string;
  source: BillingEventSource;
  summary: string;
}

const BILLING_EVENT_BUFFER_LIMIT = 200;
const billingEvents: BillingEvent[] = [];

function recordBillingEvent(input: {
  type: string;
  source: BillingEventSource;
  summary: string;
}) {
  const event: BillingEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    type: input.type,
    source: input.source,
    summary: input.summary,
  };

  // newest first
  billingEvents.unshift(event);
  if (billingEvents.length > BILLING_EVENT_BUFFER_LIMIT) {
    billingEvents.pop();
  }
}

const priceToPlanMap: Record<string, string> = {};
if (STRIPE_PRICE_FREE) priceToPlanMap[STRIPE_PRICE_FREE] = 'FREE';
if (STRIPE_PRICE_PRO_MONTHLY) priceToPlanMap[STRIPE_PRICE_PRO_MONTHLY] = 'PRO';
if (STRIPE_PRICE_ENTERPRISE_MONTHLY)
  priceToPlanMap[STRIPE_PRICE_ENTERPRISE_MONTHLY] = 'ENTERPRISE';

function mapStripePriceToPlan(priceId: string | null): string | null {
  if (!priceId) return null;
  return priceToPlanMap[priceId] ?? null;
}

/**
 * Returns the "most relevant" subscription for a customer:
 * prefers active or trialing, falls back to latest.
 */
async function getCurrentSubscriptionForCustomer(
  stripeCustomerId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    return null;
  }

  const subs = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'all',
    limit: 5,
  });

  if (!subs.data.length) return null;

  const activeOrTrialing =
    subs.data.find((s) => s.status === 'active' || s.status === 'trialing') ??
    null;

  return activeOrTrialing ?? subs.data[0];
}

/**
 * Compute the plan truth for a given user without mutating the DB.
 */
async function computePlanTruth(user: User): Promise<PlanTruthPayload> {
  const now = new Date().toISOString();
  const stripeMode = getStripeMode();

  if (!stripe || !STRIPE_PRICE_PRO_MONTHLY) {
    return {
      internalPlan: user.plan,
      status: 'stripe_not_configured',
      stripe: {
        customerId: (user as any).stripeCustomerId ?? null,
        subscriptionId: null,
        subscriptionStatus: null,
        priceId: null,
        mappedPlan: null,
      },
      details:
        'Stripe secret key or required price IDs are not configured. Plan truth is internal-only.',
      lastCheckedAt: now,
      stripeMode,
    };
  }

  const stripeCustomerId = (user as any).stripeCustomerId as string | null;

  if (!stripeCustomerId) {
    return {
      internalPlan: user.plan,
      status: 'no_customer_id',
      stripe: {
        customerId: null,
        subscriptionId: null,
        subscriptionStatus: null,
        priceId: null,
        mappedPlan: null,
      },
      details: 'User does not have a stripeCustomerId.',
      lastCheckedAt: now,
      stripeMode,
    };
  }

  try {
    const subscription = await getCurrentSubscriptionForCustomer(
      stripeCustomerId
    );

    if (!subscription) {
      return {
        internalPlan: user.plan,
        status: 'no_active_subscription',
        stripe: {
          customerId: stripeCustomerId,
          subscriptionId: null,
          subscriptionStatus: null,
          priceId: null,
          mappedPlan: null,
        },
        details: 'No subscriptions found for Stripe customer.',
        lastCheckedAt: now,
        stripeMode,
      };
    }

    const firstItem = subscription.items.data[0];
    const priceId = firstItem?.price?.id ?? null;
    const mappedPlan = mapStripePriceToPlan(priceId);

    if (!mappedPlan) {
      return {
        internalPlan: user.plan,
        status: 'unmapped_price',
        stripe: {
          customerId: stripeCustomerId,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          priceId,
          mappedPlan: null,
        },
        details: `Stripe price ${priceId} does not have a mapping to an internal plan.`,
        lastCheckedAt: now,
        stripeMode,
      };
    }

    const status: PlanTruthStatus =
      user.plan === mappedPlan ? 'synced' : 'desynced';

    return {
      internalPlan: user.plan,
      status,
      stripe: {
        customerId: stripeCustomerId,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        priceId,
        mappedPlan,
      },
      details:
        status === 'desynced'
          ? 'Internal plan does not match Stripe subscription mapped plan.'
          : null,
      lastCheckedAt: now,
      stripeMode,
    };
  } catch (err: any) {
    console.error('[billing] Stripe error in computePlanTruth:', err);
    return {
      internalPlan: user.plan,
      status: 'stripe_error',
      stripe: {
        customerId: (user as any).stripeCustomerId ?? null,
        subscriptionId: null,
        subscriptionStatus: null,
        priceId: null,
        mappedPlan: null,
      },
      details: err?.message ?? 'Unknown Stripe error.',
      lastCheckedAt: now,
      stripeMode,
    };
  }
}

/**
 * Utility: load current DB user by email from req.user
 */
async function loadDbUserFromRequest(req: AuthenticatedRequest): Promise<User> {
  const email = req.user?.email;
  if (!email) {
    throw new Error('Authenticated user email missing from request.');
  }

  const dbUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!dbUser) {
    throw new Error('User not found for authenticated email.');
  }

  return dbUser;
}

/**
 * GET /api/billing/plan-truth
 */
router.get(
  '/plan-truth',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dbUser = await loadDbUserFromRequest(req);
      const truth = await computePlanTruth(dbUser);

      return res.json({
        success: true,
        data: truth,
      });
    } catch (err: any) {
      console.error('[billing] /plan-truth handler error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to compute plan truth.',
      });
    }
  }
);

/**
 * POST /api/billing/create-checkout-session
 */
router.post(
  '/create-checkout-session',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!stripe || !STRIPE_PRICE_PRO_MONTHLY) {
        return res.status(500).json({
          success: false,
          error:
            'Stripe is not fully configured. STRIPE_SECRET_KEY or STRIPE_PRICE_PRO_MONTHLY is missing.',
        });
      }

      const dbUser = await loadDbUserFromRequest(req);

      let stripeCustomerId = (dbUser as any).stripeCustomerId as
        | string
        | null;

      // Create Stripe customer if missing
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: dbUser.email,
          metadata: {
            userId: dbUser.id,
          },
        });

        stripeCustomerId = customer.id;

        await prisma.user.update({
          where: { email: dbUser.email },
          data: { stripeCustomerId },
        });
      }

      const originHeader = req.headers.origin as string | undefined;
      const baseUrl = originHeader || FRONTEND_URL;

      const successUrl = `${baseUrl}/dashboard/plans?checkout=success`;
      const cancelUrl = `${baseUrl}/dashboard/plans?checkout=cancelled`;

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [
          {
            price: STRIPE_PRICE_PRO_MONTHLY,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: dbUser.id,
        },
      });

      // Record local billing event for audit log
      recordBillingEvent({
        type: 'checkout.session.created',
        source: 'local',
        summary: `Started PRO upgrade for ${dbUser.email} (price: ${STRIPE_PRICE_PRO_MONTHLY}).`,
      });

      return res.status(201).json({
        success: true,
        data: {
          url: session.url,
        },
      });
    } catch (err: any) {
      console.error(
        '[billing] /create-checkout-session handler error:',
        err
      );
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to create Checkout session.',
      });
    }
  }
);

/**
 * POST /api/billing/sync
 */
router.post(
  '/sync',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dbUser = await loadDbUserFromRequest(req);

      const truthBefore = await computePlanTruth(dbUser);
      const mappedPlan = truthBefore.stripe.mappedPlan;

      if (!mappedPlan) {
        recordBillingEvent({
          type: 'billing.sync.skipped',
          source: 'local',
          summary:
            'Sync skipped: Stripe subscription does not map to a known internal plan.',
        });

        return res.status(400).json({
          success: false,
          error:
            'Cannot sync because Stripe subscription does not map to a known internal plan.',
          data: truthBefore,
        });
      }

      if (truthBefore.status === 'synced') {
        recordBillingEvent({
          type: 'billing.plan.already_synced',
          source: 'local',
          summary:
            'Sync requested but internal plan already matches Stripe-mapped plan.',
        });

        return res.json({
          success: true,
          data: truthBefore,
          message: 'Plan is already in sync with Stripe.',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { email: dbUser.email },
        data: { plan: mappedPlan },
      });

      // Recompute truth after updating the internal plan
      const truthAfter = await computePlanTruth(updatedUser);

      recordBillingEvent({
        type: 'billing.plan.synced_from_stripe',
        source: 'local',
        summary: `Updated internal plan for ${updatedUser.email} to ${mappedPlan} using current Stripe subscription.`,
      });

      return res.json({
        success: true,
        data: truthAfter,
      });
    } catch (err: any) {
      console.error('[billing] /sync handler error:', err);

      recordBillingEvent({
        type: 'billing.sync.error',
        source: 'local',
        summary: `Error while syncing plan from Stripe: ${err?.message || 'Unknown error'}.`,
      });

      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to sync plan from Stripe.',
      });
    }
  }
);

/**
 * GET /api/billing/webhook-events
 * Returns recent billing events (local +, in future, Stripe webhooks).
 */
router.get(
  '/webhook-events',
  requireAuth,
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const limitParam = _req.query.limit;
      const limitRaw =
        typeof limitParam === 'string' ? parseInt(limitParam, 10) : NaN;
      const limit =
        !isNaN(limitRaw) && limitRaw > 0 && limitRaw <= BILLING_EVENT_BUFFER_LIMIT
          ? limitRaw
          : 50;

      return res.json({
        success: true,
        data: billingEvents.slice(0, limit),
      });
    } catch (err: any) {
      console.error('[billing] /webhook-events handler error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to load billing events.',
      });
    }
  }
);

export default router;








