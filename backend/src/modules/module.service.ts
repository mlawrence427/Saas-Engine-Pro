// backend/src/modules/module.service.ts
import prisma from "../lib/prisma";
import type { User } from "@prisma/client";

import { PlanTier } from "@prisma/client";
import type { User } from "@prisma/client";

export async function listModulesForUser(user: User) {
  // Base: modules allowed by plan
  const modules = await prisma.module.findMany({
    where: {
      isActive: true,
      minPlan: { lte: user.plan }, // works if enum order FREE < PRO < ENTERPRISE
    },
    orderBy: { name: "asc" },
  });

  const accessOverrides = await prisma.moduleAccess.findMany({
    where: { userId: user.id },
  });

  const overridesMap = new Map(
    accessOverrides.map((a) => [a.moduleId, a.canUse])
  );

  return modules.filter((m) => {
    const override = overridesMap.get(m.id);
    if (override === undefined) return true; // no override => use plan rule
    return override; // true or false
  });
}
