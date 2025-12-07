// backend/src/modules/module.service.ts

import {
  PlanTier,
  Module,
  ModuleAccess,
  User,
  UserRole,
} from "@prisma/client";
import prisma from "../lib/prisma";

const PLAN_ORDER: PlanTier[] = [
  PlanTier.FREE,
  PlanTier.PRO,
  PlanTier.ENTERPRISE,
];

const planRank = (plan: PlanTier) => PLAN_ORDER.indexOf(plan);

export type ModuleVisibleToUser = Module;

// ✅ user MUST have id, plan, role
export async function listModulesForUser(
  user: Pick<User, "id" | "plan" | "role">
): Promise<ModuleVisibleToUser[]> {
  const [allActiveModules, moduleAccesses] = await Promise.all([
    prisma.module.findMany({
      where: { isActive: true },
    }),
    prisma.moduleAccess.findMany({
      where: { userId: user.id },
    }),
  ]);

  // Map overrides
  const accessByModuleId = new Map<string, ModuleAccess>();
  for (const access of moduleAccesses) {
    accessByModuleId.set(access.moduleId, access);
  }

  const userRank = planRank(user.plan);
  const isAdmin = user.role === UserRole.ADMIN;

  const visibleModules = allActiveModules.filter((module) => {
    // ✅ 0. Governance: hide unreviewed modules for non-admins
    if (!isAdmin && module.requiresReview) {
      return false;
    }

    // ✅ 1. Per-user override
    const override = accessByModuleId.get(module.id);
    if (override) {
      return true;
    }

    // ✅ 2. Plan gating
    const moduleRank = planRank(module.minPlan);
    if (userRank === -1 || moduleRank === -1) return false;

    return moduleRank <= userRank;
  });

  return visibleModules;
}



