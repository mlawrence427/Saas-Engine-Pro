// backend/src/routes/module.routes.ts
import { Router } from "express";
import prisma from "../lib/prisma";
import requireAuth from "../middleware/requireAuth";
import { listModulesForUser } from "../modules/module.service";
import { PlanTier } from "@prisma/client";
import requirePlan from "../middleware/requirePlan";

const router = Router();

/**
 * GET /api/modules
 * Returns modules available to the current user:
 * - base on their plan (minPlan <= user.plan)
 * - plus per-user overrides from ModuleAccess
 */
router.get(
  "/",
  requireAuth, // populates (req as any).user
  async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const modules = await listModulesForUser(user);

      return res.json(
        modules.map((m) => ({
          id: m.id,
          slug: m.slug,
          name: m.name,
          description: m.description,
          minPlan: m.minPlan,
          isActive: m.isActive,
        }))
      );
    } catch (err) {
      console.error("Error listing modules", err);
      return res.status(500).json({ error: "Failed to load modules" });
    }
  }
);

/**
 * (Optional) Admin endpoint to create modules manually
 * You can put your own auth/role check here.
 */
router.post(
  "/",
  requireAuth,
  // requirePlan(PlanTier.ENTERPRISE), // if you want only Enterprise to create modules manually
  async (req, res) => {
    try {
      const { slug, name, description, minPlan } = req.body;

      if (!slug || !name) {
        return res
          .status(400)
          .json({ error: "slug and name are required fields" });
      }

      const module = await prisma.module.create({
        data: {
          slug,
          name,
          description: description ?? "",
          minPlan: minPlan ?? PlanTier.FREE,
          isActive: true,
        },
      });

      return res.status(201).json(module);
    } catch (err: any) {
      console.error("Error creating module", err);
      return res
        .status(500)
        .json({ error: err?.message ?? "Failed to create module" });
    }
  }
);

export default router;

