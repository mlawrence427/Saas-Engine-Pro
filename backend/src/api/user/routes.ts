import { Router, Response } from "express";
import prisma from "../../utils/prisma";
import { requireAuth, AuthRequest } from "../../middleware/requireAuth";

const router = Router();

// GET /api/user/me
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in /api/user/me:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;
