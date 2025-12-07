import { Request, Response, NextFunction } from "express";
import { PlanTier } from "@prisma/client";

export function requirePlan(minPlan: PlanTier) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user; // however you attach it

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const order = [PlanTier.FREE, PlanTier.PRO, PlanTier.ENTERPRISE];
    const ok =
      order.indexOf(user.plan) >= 0 &&
      order.indexOf(user.plan) >= order.indexOf(minPlan);

    if (!ok) {
      return res.status(402).json({ error: "Upgrade required" });
    }

    next();
  };
}
