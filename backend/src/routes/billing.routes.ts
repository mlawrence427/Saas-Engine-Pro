// src/routes/billing.routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { billingService } from '../services/billing.service';

const router = Router();

/**
 * GET /api/billing/me
 *
 * Returns the current user's plan + latest subscription info.
 * Used by the UI to show "Current Plan" and billing status.
 */
router.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const info = await billingService.getBillingInfo(user.id);

      return res.json({
        success: true,
        plan: user.plan, // from auth middleware (DB-truth)
        billing: info,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/billing/checkout
 *
 * Creates a Stripe Checkout Session for a subscription.
 * Expects:
 *  - priceId: string (Stripe Price ID for CORE/POWER/ELITE)
 *  - successUrl: string (where to send the user after payment)
 *  - cancelUrl: string (where to send them if they cancel)
 */
router.post(
  '/checkout',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { priceId, successUrl, cancelUrl } = req.body as {
        priceId?: string;
        successUrl?: string;
        cancelUrl?: string;
      };

      if (!priceId || !successUrl || !cancelUrl) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['priceId', 'successUrl', 'cancelUrl'],
        });
      }

      const session = await billingService.createCheckoutSession({
        userId: user.id,
        priceId,
        successUrl,
        cancelUrl,
      });

      return res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Billing Portal session so the user can
 * manage their subscription.
 *
 * Expects:
 *  - returnUrl: string
 */
router.post(
  '/portal',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { returnUrl } = req.body as { returnUrl?: string };

      if (!returnUrl) {
        return res.status(400).json({
          error: 'Missing required field: returnUrl',
        });
      }

      const portal = await billingService.createPortalSession(
        user.id,
        returnUrl
      );

      return res.json({
        success: true,
        url: portal.url,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/billing/sync
 *
 * Forces a re-sync of the current user's plan from StripeSubscription records.
 * Safety valve for:
 *  - Webhook delivery issues
 *  - Support troubleshooting ("Fix my plan" button)
 */
router.post(
  '/sync',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const plan = await billingService.syncUserPlan(user.id);

      return res.json({
        success: true,
        plan,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;


