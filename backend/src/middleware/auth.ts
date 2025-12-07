// ============================================================
// src/middleware/auth.ts - Barrel Export
// ============================================================

// Core auth middleware
export { default as requireAuth, optionalAuth } from './requireAuth';

// Role-based access control
export { 
  default as requireRole,
  requireRole as requireRoles,  // Alias for clarity when using multiple
  requireMinRole,
  requireAdmin,
  requireFounder,
} from './requireRole';

// Plan-based access control
export {
  default as requirePlan,
  requirePlan as requireMinPlan,  // Alias for consistency with requireMinRole
  requirePro,
  requireEnterprise,
  hasPlanAccess,
  getPlanLevel,
} from './requirePlan';
