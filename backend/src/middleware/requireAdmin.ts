// src/middleware/requireAdmin.ts
import { RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { requireRole } from './auth.middleware';

/**
 * Middleware that requires ADMIN or FOUNDER role.
 * Thin wrapper around requireRole for legacy imports.
 */
export const requireAdmin: RequestHandler = requireRole(Role.ADMIN, Role.FOUNDER);