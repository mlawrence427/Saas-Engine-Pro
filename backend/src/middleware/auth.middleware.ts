// src/middleware/auth.middleware.ts - PRODUCTION FIXED (DB = source of truth)

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, PlanTier } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../config/database';
import type { AuthUser } from '../types';

// ======================================================
// Types
// ======================================================

// What other files can import as req type
export interface AuthRequest extends Request {
  user?: AuthUser;
}

// JWT payload we sign/verify
// ❗ NOTE: plan is intentionally NOT included – plan comes from DB
interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

// ======================================================
// JWT helpers
// ======================================================

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as string;

export const generateToken = (
  payload: JWTPayload
): string => {
  return (jwt as any).sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  }) as string;
};

const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

// ======================================================
// requireAuth
// ======================================================

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing bearer token' });
      return;
    }

    const token = header.slice('Bearer '.length);

    let payload: JWTPayload;
    try {
      payload = verifyToken(token);
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // 🔒 Always fetch fresh user state from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        isDeleted: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (user.isDeleted) {
      res.status(401).json({ error: 'Account has been deactivated' });
      return;
    }

    // ✅ Use DB values, not token claims, as the truth
    (req as AuthRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    next();
  } catch (err) {
    next(err);
  }
};

// ======================================================
// optionalAuth
// ======================================================

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next();
    }

    try {
      const token = header.slice('Bearer '.length);
      const payload = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          plan: true,
          isDeleted: true,
        },
      });

      if (user && !user.isDeleted) {
        (req as AuthRequest).user = {
          id: user.id,
          email: user.email,
          role: user.role,
          plan: user.plan,
        };
      }
    } catch {
      // Invalid token → treat as unauthenticated
    }

    next();
  } catch (err) {
    next(err);
  }
};

// ======================================================
// Role / plan gating
// ======================================================

const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 1,
  SUBSCRIBER: 2,
  ADMIN: 3,
  FOUNDER: 4,
};

const PLAN_HIERARCHY: Record<PlanTier, number> = {
  FREE: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

/**
 * Require user to have one of the allowed roles (hierarchy-based)
 */
export const requireRole = (...allowed: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const userLevel = ROLE_HIERARCHY[user.role];
      const ok = allowed.some((r) => userLevel >= ROLE_HIERARCHY[r]);

      if (!ok) {
        res.status(403).json({
          error: 'Insufficient role',
          code: 'INSUFFICIENT_ROLE',
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
 * Require user to have EXACTLY one of the specified roles
 * (FOUNDER always bypasses)
 */
export const requireExactRole = (...allowed: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      if (user.role === 'FOUNDER') {
        return next();
      }

      if (!allowed.includes(user.role)) {
        res.status(403).json({
          error: 'Insufficient role',
          code: 'INSUFFICIENT_ROLE',
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
 * Require user to have one of the allowed plans (hierarchy-based)
 */
export const requirePlan = (...allowed: PlanTier[]) => {
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
      const ok = allowed.some((p) => userLevel >= PLAN_HIERARCHY[p]);

      if (!ok) {
        res.status(403).json({
          error: 'Upgrade required',
          code: 'PLAN_UPGRADE_REQUIRED',
          currentPlan: user.plan,
          requiredPlans: allowed,
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
 * Convenience helpers
 */
export const requireAdmin = requireRole('ADMIN');
export const requireFounder = requireExactRole('FOUNDER');
