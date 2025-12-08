// src/middleware/index.ts
// Re-export auth middleware as the single source of truth
export {
  AuthRequest,
  generateToken,
  requireAuth,
  requireRole,
  requirePlan,
  optionalAuth,
} from './auth.middleware';

// Re-export requireAdmin from its wrapper (does not conflict with requireRole)
export { requireAdmin } from './requireAdmin';