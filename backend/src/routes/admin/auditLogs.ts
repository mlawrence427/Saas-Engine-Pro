// ============================================================
// src/routes/admin/auditLogs.ts - SaaS Engine Pro
// Admin Audit Log Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../../prismaClient';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { 
  Role, 
  AuditAction, 
  AuditEntityType,
} from '@prisma/client';

const router = Router();

// ============================================================
// GET /api/admin/audit-logs
// List audit logs with filtering
// ============================================================

router.get(
  '/',
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { 
      action, 
      entityType, 
      entityId,
      performedByUserId,
      startDate,
      endDate,
      limit = '50', 
      offset = '0',
    } = req.query;

    try {
      const where: {
        action?: AuditAction;
        entityType?: AuditEntityType;
        entityId?: string;
        performedByUserId?: string;
        createdAt?: { gte?: Date; lte?: Date };
      } = {};

      if (action && Object.values(AuditAction).includes(action as AuditAction)) {
        where.action = action as AuditAction;
      }

      if (entityType && Object.values(AuditEntityType).includes(entityType as AuditEntityType)) {
        where.entityType = entityType as AuditEntityType;
      }

      if (entityId && typeof entityId === 'string') {
        where.entityId = entityId;
      }

      if (performedByUserId && typeof performedByUserId === 'string') {
        where.performedByUserId = performedByUserId;
      }

      // Date range filtering
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Math.min(parseInt(limit as string, 10) || 50, 200),
          skip: parseInt(offset as string, 10) || 0,
          include: {
            performedByUser: {
              select: { id: true, email: true },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            total,
            limit: parseInt(limit as string, 10) || 50,
            offset: parseInt(offset as string, 10) || 0,
          },
        },
      });

    } catch (error) {
      console.error('List audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'ListFailed',
        message: 'Failed to list audit logs',
      });
    }
  }
);

// ============================================================
// GET /api/admin/audit-logs/entity/:entityType/:entityId
// Get audit logs for a specific entity
// ============================================================

router.get(
  '/entity/:entityType/:entityId',
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { entityType, entityId } = req.params;

    if (!Object.values(AuditEntityType).includes(entityType as AuditEntityType)) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: `Invalid entityType. Must be one of: ${Object.values(AuditEntityType).join(', ')}`,
      });
      return;
    }

    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          entityType: entityType as AuditEntityType,
          entityId,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          performedByUser: {
            select: { id: true, email: true },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          entityType,
          entityId,
          logs,
          totalLogs: logs.length,
        },
      });

    } catch (error) {
      console.error('Get entity audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'GetFailed',
        message: 'Failed to get entity audit logs',
      });
    }
  }
);

// ============================================================
// GET /api/admin/audit-logs/user/:userId
// Get audit logs performed by a specific user
// ============================================================

router.get(
  '/user/:userId',
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    try {
      const [logs, total, user] = await Promise.all([
        prisma.auditLog.findMany({
          where: { performedByUserId: userId },
          orderBy: { createdAt: 'desc' },
          take: Math.min(parseInt(limit as string, 10) || 50, 200),
          skip: parseInt(offset as string, 10) || 0,
        }),
        prisma.auditLog.count({ where: { performedByUserId: userId } }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true },
        }),
      ]);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'UserNotFound',
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user,
          logs,
          pagination: {
            total,
            limit: parseInt(limit as string, 10) || 50,
            offset: parseInt(offset as string, 10) || 0,
          },
        },
      });

    } catch (error) {
      console.error('Get user audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'GetFailed',
        message: 'Failed to get user audit logs',
      });
    }
  }
);

// ============================================================
// GET /api/admin/audit-logs/stats
// Get audit log statistics
// ============================================================

router.get(
  '/stats',
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const [
        totalLogs,
        actionCounts,
        last24Hours,
        last7Days,
      ] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: true,
        }),
        prisma.auditLog.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.auditLog.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalLogs,
          last24Hours,
          last7Days,
          byAction: actionCounts.reduce((acc, item) => {
            acc[item.action] = item._count;
            return acc;
          }, {} as Record<string, number>),
        },
      });

    } catch (error) {
      console.error('Get audit stats error:', error);
      res.status(500).json({
        success: false,
        error: 'StatsFailed',
        message: 'Failed to get audit log statistics',
      });
    }
  }
);

export default router;