// backend/src/routes/admin.modules.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const planTierEnum = z.enum(["FREE", "PRO", "ENTERPRISE"]);

const moduleCreateSchema = z.object({
  key: z.string().min(2).max(64),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  minPlan: planTierEnum.default("FREE"),
  enabled: z.boolean().default(true),
  defaultConfig: z
    .union([z.record(z.any()), z.array(z.any())])
    .optional()
    .nullable(),
});

const moduleUpdateSchema = moduleCreateSchema.partial();

// All routes require ADMIN
router.use(requireAuth, requireRole("ADMIN"));

// GET /api/admin/modules
router.get("/", async (req, res) => {
  try {
    const modules = await prisma.module.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ modules });
  } catch (err) {
    console.error("Error fetching modules", err);
    res.status(500).json({ error: "Failed to fetch modules" });
  }
});

// GET /api/admin/modules/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const mod = await prisma.module.findUnique({ where: { id } });
    if (!mod) {
      return res.status(404).json({ error: "Module not found" });
    }
    res.json({ module: mod });
  } catch (err) {
    console.error("Error fetching module", err);
    res.status(500).json({ error: "Failed to fetch module" });
  }
});

// POST /api/admin/modules
router.post("/", async (req, res) => {
  try {
    const parsed = moduleCreateSchema.parse(req.body);

    const module = await prisma.module.create({
      data: {
        ...parsed,
        createdById: req.user?.id ?? null,
      },
    });

    res.status(201).json({ module });
  } catch (err: any) {
    console.error("Error creating module", err);

    if (err.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", issues: err.issues });
    }

    if (err.code === "P2002") {
      // Unique constraint (e.g. key)
      return res.status(409).json({ error: "Module key already exists" });
    }

    res.status(500).json({ error: "Failed to create module" });
  }
});

// PUT /api/admin/modules/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const parsed = moduleUpdateSchema.parse(req.body);

    const module = await prisma.module.update({
      where: { id },
      data: parsed,
    });

    res.json({ module });
  } catch (err: any) {
    console.error("Error updating module", err);

    if (err.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", issues: err.issues });
    }

    if (err.code === "P2025") {
      return res.status(404).json({ error: "Module not found" });
    }

    res.status(500).json({ error: "Failed to update module" });
  }
});

// DELETE /api/admin/modules/:id  (soft delete: enabled = false)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const module = await prisma.module.update({
      where: { id },
      data: { enabled: false },
    });

    res.json({ module });
  } catch (err: any) {
    console.error("Error disabling module", err);

    if (err.code === "P2025") {
      return res.status(404).json({ error: "Module not found" });
    }

    res.status(500).json({ error: "Failed to disable module" });
  }
});

export default router;
