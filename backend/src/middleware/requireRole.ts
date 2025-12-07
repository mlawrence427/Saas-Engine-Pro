// ============================================================
// src/middleware/requireRole.ts - SaaS Engine Pro
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

// ============================================================
// ROLE HIERARCHY (for >= checks)
// ============================================================

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 0,
  [Role.ADMIN]: 1,
  [Role.FOUNDER]: 2,
};

// ============================================================
// REQUIRE SPECIFIC ROLES
// ============================================================

/**
 * Middleware that requires the user to have one of the specified roles.
 * 
 * @example
 * router.post('/admin-only', requireAuth, requireRole('ADMIN', 'FOUNDER'), handler);
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
      });
      return;
    }

    next();
  };
}

// ============================================================
// REQUIRE MINIMUM ROLE (hierarchy-based)
// ============================================================

/**
 * Middleware that requires the user to have at least the specified role level.
 * Uses hierarchy: USER < ADMIN < FOUNDER
 * 
 * @example
 * router.get('/dashboard', requireAuth, requireMinRole('ADMIN'), handler);
 */
export function requireMinRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const requiredLevel = ROLE_HIERARCHY[minRole];

    if (userLevel < requiredLevel) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions',
        requiredMinRole: minRole,
        currentRole: req.user.role,
      });
      return;
    }

    next();
  };
}

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

/** Requires ADMIN or FOUNDER role */
export const requireAdmin = requireMinRole(Role.ADMIN);

/** Requires FOUNDER role only */
export const requireFounder = requireRole(Role.FOUNDER);

// Default export for backward compatibility
export default requireRole;
