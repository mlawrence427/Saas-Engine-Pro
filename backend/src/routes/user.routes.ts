// backend/src/routes/user.routes.ts

import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    plan?: string | null;
    subscriptionStatus?: string | null;
  };
}

const router = Router();

/**
 * GET /api/user/me
 * Returns the currently authenticated user.
 * Assumes JWT middleware has already populated req.user.
 */
router.get("/me", async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(dbUser);
  } catch (err) {
    console.error("[user.me] error", err);
    return res.status(500).json({ error: "Failed to load user profile" });
  }
});

export default router;

