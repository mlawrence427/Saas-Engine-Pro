// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, PlanTier } from '@prisma/client';
import { env } from '../config/env';
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

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

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
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new Error('Missing bearer token');
    }

    const token = header.slice('Bearer '.length);
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
      },
    });

    if (!user) throw new Error('User not found');

    (req as AuthRequest).user = user as AuthUser;
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
        },
      });

      if (user) {
        (req as AuthRequest).user = user as AuthUser;
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

export const requireRole = (...allowed: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthRequest).user;
      if (!user) throw new Error('Not authenticated');

      const level = ROLE_HIERARCHY[user.role];
      const ok = allowed.some((r) => level >= ROLE_HIERARCHY[r]);

      if (!ok) throw new Error('Insufficient role');
      next();
    } catch (err) {
      next(err);
    }
  };
};

export const requirePlan = (...allowed: PlanTier[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthRequest).user;
      if (!user) throw new Error('Not authenticated');

      const userLevel = PLAN_HIERARCHY[user.plan] ?? 0;
      const ok = allowed.some((p) => userLevel >= PLAN_HIERARCHY[p]);

      if (!ok) throw new Error('Insufficient plan');
      next();
    } catch (err) {
      next(err);
    }
  };
};
