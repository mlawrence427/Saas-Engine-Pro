// ============================================================
// backend/src/routes/auth.ts - SaaS Engine Pro
// Authentication Routes (Login, Register, Logout, Me)
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
  // IMPORTANT: payload uses userId (not id) to match middleware
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
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw fromZodError(parseResult.error);
      }

      const { email, password } = parseResult.data;

      const normalizedEmail = email.toLowerCase();

      console.log('🔐 Login attempt:', { email: normalizedEmail });

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      console.log('🔍 User lookup result:', {
        found: !!user,
        id: user?.id,
        email: user?.email,
      });

      if (!user || !user.passwordHash) {
        console.log('❌ Login failed: user not found or missing password hash');
        throw authenticationError(
          'Invalid email or password',
          ErrorCode.INVALID_CREDENTIALS
        );
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);

      console.log('🧪 Password valid?', validPassword);

      if (!validPassword) {
        console.log('❌ Login failed: invalid password');
        throw authenticationError(
          'Invalid email or password',
          ErrorCode.INVALID_CREDENTIALS
        );
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
      });

      setAuthCookie(res, token);

      console.log('✅ Login successful, token issued');

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
          token, // also returned for debugging
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
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw fromZodError(parseResult.error);
      }

      const { email, password } = parseResult.data;

      const normalizedEmail = email.toLowerCase();

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw conflictError('An account with this email already exists', {
          email: normalizedEmail,
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: 'USER',
          plan: 'FREE',
        },
      });

      await prisma.auditLog.create({
        data: {
          action: AuditAction.USER_CREATED,
          entityType: 'USER',
          entityId: user.id,
          performedByUserId: user.id,
          metadata: {
            email: user.email,
            source: 'self-registration',
          },
        },
      });

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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('👤 /me payload:', req.user);

      const userId = req.user!.userId;

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
        throw notFoundError('User', userId);
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


