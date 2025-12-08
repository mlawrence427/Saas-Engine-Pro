// src/middleware/module.middleware.ts - Module Access Guards

import { Request, Response, NextFunction } from 'express';
import { PlanTier } from '@prisma/client';
import { moduleService } from '../modules/module.service';
import type { AuthRequest } from './auth.middleware';
import { logger } from '../utils/logger';

/**
 * ✅ Require access to a specific module by ID (from route param)
 * 
 * Usage:
 *   router.get('/modules/:moduleId/data', requireAuth, requireModuleAccess(), handler)
 *   router.get('/feature/:id', requireAuth, requireModuleAccess('id'), handler)
 */
export const requireModuleAccess = (moduleIdParam: string = 'moduleId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const moduleId = req.params[moduleIdParam];
      if (!moduleId) {
        res.status(400).json({ error: 'Module ID required' });
        return;
      }

      const canAccess = await moduleService.canAccessModule(user.id, moduleId);
      if (!canAccess) {
        logger.warn('Module access denied', {
          userId: user.id,
          moduleId,
          userPlan: user.plan,
        });
        res.status(403).json({ 
          error: 'Module access denied',
          code: 'MODULE_ACCESS_DENIED',
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * ✅ Require access to a module by slug (from route param)
 * 
 * Usage:
 *   router.get('/m/:slug', requireAuth, requireModuleAccessBySlug(), handler)
 */
export const requireModuleAccessBySlug = (slugParam: string = 'slug') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const slug = req.params[slugParam];
      if (!slug) {
        res.status(400).json({ error: 'Module slug required' });
        return;
      }

      const canAccess = await moduleService.canAccessModuleBySlug(user.id, slug);
      if (!canAccess) {
        logger.warn('Module access denied by slug', {
          userId: user.id,
          slug,
          userPlan: user.plan,
        });
        res.status(403).json({ 
          error: 'Module access denied',
          code: 'MODULE_ACCESS_DENIED',
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * ✅ Require access to a module by key (hardcoded in route definition)
 * 
 * Usage:
 *   router.get('/analytics', requireAuth, requireModuleKey('analytics'), handler)
 *   router.post('/ai/generate', requireAuth, requireModuleKey('ai-assistant'), handler)
 */
export const requireModuleKey = (moduleKey: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const canAccess = await moduleService.canAccessModuleByKey(user.id, moduleKey);
      if (!canAccess) {
        logger.warn('Module access denied by key', {
          userId: user.id,
          moduleKey,
          userPlan: user.plan,
        });
        res.status(403).json({ 
          error: 'Module access denied',
          code: 'MODULE_ACCESS_DENIED',
          requiredModule: moduleKey,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * ✅ Require minimum plan level (simple plan gating without module)
 * Use when you don't have a module but need plan-based access
 * 
 * Usage:
 *   router.get('/premium', requireAuth, requireMinPlan('PRO'), handler)
 */
const PLAN_HIERARCHY: Record<PlanTier, number> = {
  FREE: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

export const requireMinPlan = (minPlan: PlanTier) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // FOUNDER/ADMIN bypass plan checks
      if (user.role === 'FOUNDER' || user.role === 'ADMIN') {
        return next();
      }

      const userLevel = PLAN_HIERARCHY[user.plan] ?? 0;
      const requiredLevel = PLAN_HIERARCHY[minPlan];

      if (userLevel < requiredLevel) {
        logger.debug('Plan check failed', {
          userId: user.id,
          userPlan: user.plan,
          requiredPlan: minPlan,
        });
        res.status(403).json({ 
          error: 'Upgrade required',
          code: 'PLAN_UPGRADE_REQUIRED',
          currentPlan: user.plan,
          requiredPlan: minPlan,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * ✅ Attach module access info to request for use in handlers
 * Does NOT block - just adds info
 * 
 * Usage:
 *   router.get('/modules/:moduleId', requireAuth, attachModuleAccess(), handler)
 *   // Then in handler: req.moduleAccess?.canAccess
 */
export interface ModuleAccessInfo {
  moduleId: string;
  canAccess: boolean;
  module: Awaited<ReturnType<typeof moduleService.getModuleById>> | null;
}

export interface RequestWithModuleAccess extends AuthRequest {
  moduleAccess?: ModuleAccessInfo;
}

export const attachModuleAccess = (moduleIdParam: string = 'moduleId') => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthRequest).user;
      const moduleId = req.params[moduleIdParam];

      if (!user || !moduleId) {
        return next();
      }

      const [canAccess, module] = await Promise.all([
        moduleService.canAccessModule(user.id, moduleId),
        moduleService.getModuleById(moduleId),
      ]);

      (req as RequestWithModuleAccess).moduleAccess = {
        moduleId,
        canAccess,
        module,
      };

      next();
    } catch (err) {
      // Don't fail the request, just skip attaching
      logger.error('Failed to attach module access', { error: err });
      next();
    }
  };
};