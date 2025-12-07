// ============================================================
// src/middleware/requirePlan.ts - SaaS Engine Pro
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { PlanTier } from '@prisma/client';

// ============================================================
// PLAN HIERARCHY
// ============================================================

const PLAN_HIERARCHY: Record<PlanTier, number> = {
  [PlanTier.FREE]: 0,
  [PlanTier.PRO]: 1,
  [PlanTier.ENTERPRISE]: 2,
};

// ============================================================
// REQUIRE MINIMUM PLAN
// ============================================================

/**
 * Middleware that requires the user to have at least the specified plan tier.
 * Uses hierarchy: FREE < PRO < ENTERPRISE
 * 
 * NOTE: This uses req.user.plan set by requireAuth. 
 * Must be used AFTER requireAuth middleware.
 * 
 * @example
 * router.get('/pro-feature', requireAuth, requirePlan('PRO'), handler);
 */
export function requirePlan(minPlan: PlanTier) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Must be used after requireAuth
    if (!req.user) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const userPlanLevel = PLAN_HIERARCHY[req.user.plan];
    const requiredPlanLevel = PLAN_HIERARCHY[minPlan];

    // Handle unknown plan tiers (shouldn't happen with Prisma enums)
    if (userPlanLevel === undefined || requiredPlanLevel === undefined) {
      console.error('Unknown plan tier:', { 
        userPlan: req.user.plan, 
        minPlan 
      });
      res.status(500).json({ 
        error: 'ConfigError',
        message: 'Invalid plan configuration',
      });
      return;
    }

    if (userPlanLevel < requiredPlanLevel) {
      res.status(402).json({ 
        error: 'UpgradeRequired',
        message: `This feature requires ${minPlan} plan or higher`,
        requiredPlan: minPlan,
        currentPlan: req.user.plan,
        upgradeUrl: '/settings/billing', // Frontend can use this
      });
      return;
    }

    next();
  };
}

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

/** Requires PRO or ENTERPRISE plan */
export const requirePro = requirePlan(PlanTier.PRO);

/** Requires ENTERPRISE plan only */
export const requireEnterprise = requirePlan(PlanTier.ENTERPRISE);

// ============================================================
// PLAN CHECK UTILITY (non-middleware)
// ============================================================

/**
 * Check if a user's plan meets the minimum requirement.
 * Useful for conditional logic in route handlers.
 * 
 * @example
 * if (hasPlanAccess(req.user.plan, 'PRO')) {
 *   // Show pro features
 * }
 */
export function hasPlanAccess(userPlan: PlanTier, minPlan: PlanTier): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[minPlan];
}

/**
 * Get the numeric level of a plan tier.
 * Useful for comparisons and sorting.
 */
export function getPlanLevel(plan: PlanTier): number {
  return PLAN_HIERARCHY[plan];
}

export default requirePlan;
