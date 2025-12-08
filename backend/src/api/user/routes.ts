// backend/src/api/user/routes.ts
import { Router, Response } from "express";
import { prisma } from "../../utils/prisma";
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// ==================== GET /api/user/me ====================
router.get(
  "/me",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      // ✅ req.user.id comes from the JWT in requireAuth
      const user = await prisma.user.findUnique({
        where: {
          id: req.user!.id, // IMPORTANT: use a unique field
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(user);
    } catch (err) {
      console.error("Error in GET /api/user/me:", err);
      return res.status(500).json({ error: "Failed to load user" });
    }
  }
);

export default router;
