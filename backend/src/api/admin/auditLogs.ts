import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, requireRole } from '../../middleware/auth';
import { AuditAction, AuditEntityType } from '@prisma/client';

const router = Router();

/**
 * GET /api/admin/audit-logs
 * Query params:
 *  - action?: AuditAction
 *  - entityType?: AuditEntityType
 *  - userId?: string (performedByUserId)
 *  - cursor?: string (for pagination)
 *  - limit?: number (default 50, max 100)
 */
router.get(
  '/',
  requireAuth,
  requireRole(['ADMIN', 'FOUNDER']),
  async (req, res) => {
    try {
      const { action, entityType, userId, cursor, limit = '50' } = req.query;

      const take = Math.min(parseInt(limit as string, 10) || 50, 100);

      const where: any = {};
      if (action && typeof action === 'string') {
        where.action = action as AuditAction;
      }
      if (entityType && typeof entityType === 'string') {
        where.entityType = entityType as AuditEntityType;
      }
      if (userId && typeof userId === 'string') {
        where.performedByUserId = userId;
      }

      const records = await prisma.auditLog.findMany({
        where,
        include: {
          performedByUser: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: take + 1,
        ...(cursor
          ? {
              cursor: { id: cursor as string },
              skip: 1,
            }
          : {}),
      });

      let nextCursor: string | null = null;
      if (records.length > take) {
        const nextItem = records.pop();
        nextCursor = nextItem!.id;
      }

      res.json({
        data: records,
        nextCursor,
      });
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      res.status(500).json({ error: 'Failed to fetch audit logs.' });
    }
  }
);

export default router;
