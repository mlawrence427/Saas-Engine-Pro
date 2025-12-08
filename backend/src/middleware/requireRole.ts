// src/middleware/requireRole.ts
import { Role } from '@prisma/client';
import type { RequestHandler } from 'express';
import { requireRole as baseRequireRole } from './auth.middleware';

// Re-export the Role type for convenience in any legacy code
export { Role };

// Simple pass-through wrapper so old imports keep working.
export const requireRole = (...roles: Role[]): RequestHandler => {
  return baseRequireRole(...roles);
};
