// src/middleware/requirePlan.ts
import { Request, Response, NextFunction } from "express";
import { PlanTier } from "@prisma/client";

// Extend Request with the user that requireAuth attaches
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    plan: PlanTier;
    // add other fields (email, role, etc.) if you have them
    [key: string]: any;
  };
};

/**
 * Factory middleware: ensure the user has at least `minPlan`.
 *
 * Usage: router.post("/...", requireAuth, requirePlan(PlanTier.PRO), handler)
 */
export const requirePlan = (minPlan: PlanTier) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      // Should normally be blocked by requireAuth, but be defensive.
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userPlan = user.plan;

    // Define explicit plan ordering
    const order: PlanTier[] = [PlanTier.FREE, PlanTier.PRO, PlanTier.ENTERPRISE];

    const userIdx = order.indexOf(userPlan);
    const minIdx = order.indexOf(minPlan);

    if (userIdx === -1 || minIdx === -1) {
      // Misconfigured plan, treat as unauthorized
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userIdx < minIdx) {
      // User is on too low of a plan
      return res.status(402).json({ message: "Upgrade required", requiredPlan: minPlan });
    }

    next();
  };
};
