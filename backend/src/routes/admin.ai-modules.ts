// backend/src/routes/admin.ai-modules.ts
import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// GET /api/admin/ai-modules
router.get("/", requireAuth, requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const drafts = await prisma.aIModuleDraft.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        minPlan: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({ drafts });
  } catch (err) {
    console.error("Error fetching AI module drafts", err);
    res.status(500).json({ message: "Failed to fetch drafts" });
  }
});

// GET /api/admin/ai-modules/:id
router.get("/:id", requireAuth, requireRole("ADMIN"), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const draft = await prisma.aIModuleDraft.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        minPlan: true,
        status: true,
        createdAt: true,
        schemaDiff: true,
        routesPreview: true,
        permissions: true,
      },
    });

    if (!draft) {
      return res.status(404).json({ message: "Draft not found" });
    }

    res.json({ draft });
  } catch (err) {
    console.error("Error fetching AI module draft", err);
    res.status(500).json({ message: "Failed to fetch draft" });
  }
});

// POST /api/admin/ai-modules/:id/approve
router.post(
  "/:id/approve",
  requireAuth,
  requireRole("ADMIN"),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const draft = await prisma.aIModuleDraft.findUnique({ where: { id } });
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }

      const updated = await prisma.aIModuleDraft.update({
        where: { id },
        data: { status: "APPROVED" },
      });

      // NOTE: In v1, we ONLY mark as approved.
      // A later step can safely turn approved drafts into real Modules.
      res.json({ draft: updated });
    } catch (err) {
      console.error("Error approving AI module draft", err);
      res.status(500).json({ message: "Failed to approve draft" });
    }
  }
);

// POST /api/admin/ai-modules/:id/reject
router.post(
  "/:id/reject",
  requireAuth,
  requireRole("ADMIN"),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const draft = await prisma.aIModuleDraft.findUnique({ where: { id } });
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }

      const updated = await prisma.aIModuleDraft.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      res.json({ draft: updated });
    } catch (err) {
      console.error("Error rejecting AI module draft", err);
      res.status(500).json({ message: "Failed to reject draft" });
    }
  }
);

export default router;
