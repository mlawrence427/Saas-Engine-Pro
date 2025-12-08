// ============================================================
// backend/src/routes/auth.ts - SaaS Engine Pro
// Authentication Routes (Login, Register, Logout)
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { AuditAction } from '@prisma/client';
import { loginSchema, registerSchema } from '../utils/validation';
import { signAccessToken } from '../utils/jwt';
import {
  fromZodError,
  authenticationError,
  conflictError,
  notFoundError,
  ErrorCode,
} from '../utils/errors';

const router = Router();

// ============================================================
// HELPERS
// ============================================================

function generateToken(user: {
  id: string;
  email: string;
  role: string;
  plan: string;
}): string {
  return signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
  });
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ============================================================
// POST /api/auth/login
// ============================================================

router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate input
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw fromZodError(parseResult.error);
      }

      const { email, password } = parseResult.data;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw authenticationError(
          'Invalid email or password',
          ErrorCode.INVALID_CREDENTIALS
        );
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        throw authenticationError(
          'Invalid email or password',
          ErrorCode.INVALID_CREDENTIALS
        );
      }

      // Generate token and set cookie
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
      });
      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            plan: user.plan,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// POST /api/auth/register
// ============================================================

router.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate input
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw fromZodError(parseResult.error);
      }

      const { email, password } = parseResult.data;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw conflictError('An account with this email already exists', {
          email,
        });
      }

      // Create user
      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'USER',
          plan: 'FREE',
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: AuditAction.USER_CREATED,
          entityType: 'USER', // string column in Prisma schema
          entityId: user.id,
          performedByUserId: user.id,
          metadata: {
            email: user.email,
            source: 'self-registration',
          },
        },
      });

      // Generate token and set cookie
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
      });
      setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            plan: user.plan,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// POST /api/auth/logout
// ============================================================

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// ============================================================
// GET /api/auth/me
// ============================================================

router.get(
  '/me',
  requireAuth,
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
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
        throw notFoundError('User', req.user!.id);
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

