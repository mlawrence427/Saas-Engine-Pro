// src/routes/billing.routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { billingService } from '../services/billing.service';

const router = Router();

/**
 * POST /api/billing/sync
 *
 * Forces a re-sync of the current user's plan from StripeSubscription records.
 * This is a safety valve for:
 *  - Webhook delivery issues
 *  - Support troubleshooting ("Fix my plan" button)
 */
router.post(
  '/sync',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
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

