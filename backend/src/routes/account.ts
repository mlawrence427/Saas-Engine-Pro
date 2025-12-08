// ============================================================
// src/routes/account.ts - SaaS Engine Pro
// User Account Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// ============================================================
// GET /api/account
// Get current authenticated user's account info
// ============================================================

router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'UserNotFound',
          message: 'User not found',
        });
        return;
      }

      // Return shape expected by frontend
      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: null, // We don't have name field yet, but frontend expects it
          role: user.role,
          plan: user.plan,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      });

    } catch (error) {
      console.error('Get account error:', error);
      res.status(500).json({
        success: false,
        error: 'AccountFetchFailed',
        message: 'Failed to fetch account information',
      });
    }
  }
);

// ============================================================
// PATCH /api/account
// Update current user's account info (future: name, preferences)
// ============================================================

router.patch(
  '/',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      
      // For now, we don't have editable fields beyond what's managed elsewhere
      // This is a placeholder for future profile updates (name, avatar, etc.)
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
        },
      });

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
          id: user.id,
          email: user.email,
          name: null,
          role: user.role,
          plan: user.plan,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      });

    } catch (error) {
      console.error('Update account error:', error);
      res.status(500).json({
        success: false,
        error: 'AccountUpdateFailed',
        message: 'Failed to update account information',
      });
    }
  }
);

export default router;