// ============================================================
// src/middleware/requireAuth.ts - SaaS Engine Pro
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prismaClient';

// ============================================================
// JWT SECRET VALIDATION (fail fast)
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('❌ JWT_SECRET environment variable is required');
}

// ============================================================
// TOKEN PAYLOAD TYPE
// ============================================================

interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// ============================================================
// MIDDLEWARE
// ============================================================

export default async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from cookie or Authorization header
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication token required',
      });
      return;
    }

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({ 
          error: 'TokenExpired',
          message: 'Authentication token has expired',
        });
        return;
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ 
          error: 'InvalidToken',
          message: 'Authentication token is invalid',
        });
        return;
      }
      throw jwtError;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        plan: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({ 
        error: 'UserNotFound',
        message: 'User no longer exists',
      });
      return;
    }

    // Attach user to request (typed via express.d.ts)
    req.user = user;
    next();
  } catch (err) {
    console.error('requireAuth error:', err);
    res.status(500).json({ 
      error: 'AuthError',
      message: 'Authentication failed',
    });
  }
}

// ============================================================
// OPTIONAL AUTH (doesn't fail, just doesn't set req.user)
// ============================================================

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        plan: true,
        role: true,
      },
    });

    if (user) {
      req.user = user;
    }
  } catch {
    // Silent fail for optional auth
  }

  next();
}



