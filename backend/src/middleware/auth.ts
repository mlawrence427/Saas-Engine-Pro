// backend/src/middleware/auth.ts
// Read JWT from cookie, verify, and attach user payload to req.user

import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AuthTokenPayload } from '../utils/jwt';
import { authenticationError } from '../utils/errors';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthTokenPayload;
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = (req as any).cookies?.token as string | undefined;

    console.log('🔐 requireAuth cookies:', (req as any).cookies);

    if (!token) {
      throw authenticationError('Invalid or expired token');
    }

    const payload = verifyAccessToken(token);

    if (!payload || !payload.userId) {
      throw authenticationError('Invalid or expired token');
    }

    req.user = payload;

    next();
  } catch (err) {
    console.error('❌ requireAuth error:', err);
    next(authenticationError('Invalid or expired token'));
  }
}


