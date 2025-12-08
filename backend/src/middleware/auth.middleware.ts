// src/middleware/auth.middleware.ts - PRODUCTION FIXED

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, PlanTier } from '@prisma/client';
import dotenv from "dotenv";
dotenv.config();
import { prisma } from '../config/database';
import type { AuthUser } from '../types';

// This is what other files can import
export interface AuthRequest extends Request {
  user?: AuthUser;
}

// JWT payload we expect to sign/verify
interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  plan: PlanTier;
}

// =====================
// JWT helpers
// =====================

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as string;

export const generateToken = (
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): string => {
  return (jwt as any).sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  }) as string;
};

const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

// =====================
// requireAuth
// =====================

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
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // ✅ CRITICAL: Always fetch fresh user data from DB
    // This ensures role/plan changes take effect immediately
    // (not waiting for token expiry)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        isDeleted: true, // ✅ Check soft delete
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // ✅ FIX: Reject deleted users
    if (user.isDeleted) {
      res.status(401).json({ error: 'Account has been deactivated' });
      return;
    }

    // ✅ Use DB values, NOT token values (token may be stale)
    (req as AuthRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,  // Fresh from DB
      plan: user.plan,  // Fresh from DB
    };

    next();
  } catch (err) {
    next(err);
  }
};

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

      // ✅ Only attach if user exists and not deleted
      if (user && !user.isDeleted) {
        (req as AuthRequest).user = {
          id: user.id,
          email: user.email,
          role: user.role,
          plan: user.plan,
        };
      }
    } catch {
      // invalid token → just continue unauthenticated
    }

    next();
  } catch (err) {
    next(err);
  }
};

// =====================
// role / plan gating
// =====================

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
 * ✅ Require user to have one of the allowed roles
 * 
 * IMPORTANT: This uses HIERARCHY logic:
 * - FOUNDER (4) can access anything
 * - ADMIN (3) can access ADMIN, SUBSCRIBER, USER routes
 * - SUBSCRIBER (2) can access SUBSCRIBER, USER routes
 * - USER (1) can only access USER routes
 * 
 * If you need EXACT role matching (e.g., only SUBSCRIBER, not ADMIN),
 * use requireExactRole() instead.
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
 * ✅ Require user to have EXACTLY one of the specified roles
 * No hierarchy - must be exact match (FOUNDER always bypasses)
 * 
 * Usage:
 *   requireExactRole('SUBSCRIBER') - only SUBSCRIBER (and FOUNDER)
 *   requireExactRole('ADMIN') - only ADMIN (and FOUNDER)
 */
export const requireExactRole = (...allowed: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // FOUNDER always bypasses
      if (user.role === 'FOUNDER') {
        return next();
      }

      // Must have exact role
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
 * ✅ Require user to have one of the allowed plans (hierarchy-based)
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
 * ✅ Require ADMIN or FOUNDER role (convenience helper)
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * ✅ Require FOUNDER role only
 */
export const requireFounder = requireExactRole('FOUNDER');