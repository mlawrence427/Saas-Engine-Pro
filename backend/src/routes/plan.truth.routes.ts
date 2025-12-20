// backend/src/routes/plan.truth.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../utils/prisma";

const router = Router();

/**
 * GET /api/plan/truth
 *
 * Emits account + plan truth as deterministic JSON.
 * Non-goal: enforcement. Outcomes. Authorization.
 */
router.get("/truth", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    // Minimal read: only the fields needed to emit plan truth.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        stripeCustomerId: true,
        isDeleted: true,
        deletedAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }

    return res.json({
      ok: true,
      truth: {
        subject: `user:${user.id}`,
        account: {
          userId: user.id,
          email: user.email,
          role: user.role,
          isDeleted: user.isDeleted,
          deletedAt: user.deletedAt,
        },
        plan: {
          value: user.plan,
          source: user.stripeCustomerId ? "stripe+db" : "db",
        },
        billing: {
          hasStripeCustomer: Boolean(user.stripeCustomerId),
          stripeCustomerId: user.stripeCustomerId ? "[present]" : null, // do not leak IDs in demo logs
        },
        asOf: user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("plan truth error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

export default router;
