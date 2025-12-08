// src/types/index.ts
import type { User, Role, PlanTier } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  plan: PlanTier;
  // Optional for future – not in the DB right now
  name?: string | null;
}

/**
 * Helper to map a Prisma User into the lightweight AuthUser shape.
 */
export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
    // name not in schema; leave as undefined
    name: undefined,
  };
}

