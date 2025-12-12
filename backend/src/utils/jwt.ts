// backend/src/utils/jwt.ts

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  plan: string;
}

/**
 * Sign an access token for the authenticated user.
 */
export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify and decode an access token.
 */
export function verifyAccessToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as AuthTokenPayload;
}






