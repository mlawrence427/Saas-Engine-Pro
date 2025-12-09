// src/routes/protected.routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePlan, AuthRequest } from '../middleware/auth.middleware';
import { PlanTier } from '@prisma/client';

const router = Router();

/**
 * GET /api/protected/pro
 *
 * Demo endpoint:
 *  - Requires authentication
 *  - Requires at least PRO plan
 *
 * Before upgrade: returns 403 PLAN_UPGRADE_REQUIRED
 * After upgrade: returns 200 with success payload
 */
router.get(
  '/pro',
  requireAuth,
  requirePlan('PRO' as PlanTier),
  (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as AuthRequest).user;

    return res.json({
      ok: true,
      message: 'You have access to PRO-only features.',
      user: {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        plan: user?.plan,
      },
    });
  }
);

export default router;
