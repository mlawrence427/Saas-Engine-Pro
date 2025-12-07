// ============================================================
// src/types/express.d.ts - Express Type Augmentation
// ============================================================

import { Role, PlanTier } from '@prisma/client';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  plan: PlanTier;
}

// Re-export for convenience
export { Role, PlanTier } from '@prisma/client';

