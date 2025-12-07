// backend/src/middleware/requirePlan.ts
import { Request, Response, NextFunction } from "express";
import { PlanTier } from "@prisma/client";
import { prisma } from "../lib/prisma";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    plan: PlanTier;
    [key: string]: any;
  };
};

export const requirePlan = (minPlan: PlanTier) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { plan: true },
      });
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!dbUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userPlan = dbUser.plan;

    const order: PlanTier[] = [PlanTier.FREE, PlanTier.PRO, PlanTier.ENTERPRISE];

    const userIdx = order.indexOf(userPlan);
    const minIdx = order.indexOf(minPlan);

    if (userIdx === -1 || minIdx === -1) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userIdx < minIdx) {
      return res.status(402).json({ message: "Upgrade required", requiredPlan: minPlan });
    }

    next();
  };
};
