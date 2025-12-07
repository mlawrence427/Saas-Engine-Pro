// ============================================================
// src/routes/admin/users.ts - SaaS Engine Pro
// Admin User Management Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../../prismaClient';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { 
  Role, 
  PlanTier, 
  AuditAction, 
  AuditEntityType,
} from '@prisma/client';

const router = Router();

// ============================================================
// GET /api/admin/users
// List all users
// ============================================================

router.get(
  '/',
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { role, plan, limit = '50', offset = '0' } = req.query;

    try {
      const where: { role?: Role; plan?: PlanTier } = {};

      if (role && Object.values(Role).includes(role as Role)) {
        where.role = role as Role;
      }

      if (plan && Object.values(PlanTier).includes(plan as PlanTier)) {
        where.plan = plan as PlanTier;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            role: true,
            plan: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: Math.min(parseInt(limit as string, 10) || 50, 100),
          skip: parseInt(offset as string, 10) || 0,
        }),
        prisma.user.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            limit: parseInt(limit as string, 10) || 50,
            offset: parseInt(offset as string, 10) || 0,
          },
        },
      });

    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({
        success: false,
        error: 'ListFailed',
        message: 'Failed to list users',
      });
    }
  }
);

// ============================================================
// PATCH /api/admin/users/:id/role
// Update a user's role
// ============================================================

router.patch(
  '/:id/role',
  requireAuth,
  requireRole(Role.FOUNDER), // Only FOUNDER can change roles
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { role } = req.body;
    const adminUserId = req.user!.id;

    if (!role || !Object.values(Role).includes(role as Role)) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: `Invalid role. Must be one of: ${Object.values(Role).join(', ')}`,
      });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'UserNotFound',
          message: 'User not found',
        });
        return;
      }

      if (user.role === role) {
        res.status(400).json({
          success: false,
          error: 'NoChange',
          message: `User already has role ${role}`,
        });
        return;
      }

      const previousRole = user.role;

      // Update with audit log
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id },
          data: { role: role as Role },
          select: {
            id: true,
            email: true,
            role: true,
            plan: true,
          },
        });

        await tx.auditLog.create({
          data: {
            action: AuditAction.ROLE_CHANGED,
            entityType: AuditEntityType.USER,
            entityId: updated.id,
            performedByUserId: adminUserId,
            metadata: {
              email: updated.email,
              previousRole,
              newRole: role,
            },
          },
        });

        return updated;
      });

      res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
        data: { user: result },
      });

    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({
        success: false,
        error: 'UpdateFailed',
        message: 'Failed to update user role',
      });
    }
  }
);

// ============================================================
// PATCH /api/admin/users/:id/plan
// Update a user's plan (manual override)
// ============================================================

router.patch(
  '/:id/plan',
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { plan } = req.body;
    const adminUserId = req.user!.id;

    if (!plan || !Object.values(PlanTier).includes(plan as PlanTier)) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: `Invalid plan. Must be one of: ${Object.values(PlanTier).join(', ')}`,
      });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'UserNotFound',
          message: 'User not found',
        });
        return;
      }

      const previousPlan = user.plan;
      const isUpgrade = getPlanLevel(plan as PlanTier) > getPlanLevel(previousPlan);

      // Update with audit log
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id },
          data: { plan: plan as PlanTier },
          select: {
            id: true,
            email: true,
            role: true,
            plan: true,
          },
        });

        await tx.auditLog.create({
          data: {
            action: isUpgrade ? AuditAction.PLAN_UPGRADED : AuditAction.PLAN_DOWNGRADED,
            entityType: AuditEntityType.USER,
            entityId: updated.id,
            performedByUserId: adminUserId,
            metadata: {
              email: updated.email,
              previousPlan,
              newPlan: plan,
              source: 'admin-manual',
            },
          },
        });

        return updated;
      });

      res.status(200).json({
        success: true,
        message: `User plan ${isUpgrade ? 'upgraded' : 'changed'} to ${plan}`,
        data: { user: result },
      });

    } catch (error) {
      console.error('Update plan error:', error);
      res.status(500).json({
        success: false,
        error: 'UpdateFailed',
        message: 'Failed to update user plan',
      });
    }
  }
);

// Helper function
function getPlanLevel(plan: PlanTier): number {
  const levels: Record<PlanTier, number> = {
    [PlanTier.FREE]: 0,
    [PlanTier.PRO]: 1,
    [PlanTier.ENTERPRISE]: 2,
  };
  return levels[plan];
}

export default router;