// backend/src/routes/module.registry.routes.ts

import { Router, Response } from "express";
import prisma from "../lib/prisma";
import requireAuth, { AuthenticatedRequest } from "../middleware/requireAuth";
import requireAdmin from "../middleware/requireAdmin";
import { PlanTier } from "@prisma/client";

const router = Router();

type RegistryRequest = {
  name?: string;
  slug?: string;
  description?: string;
  minPlan?: PlanTier;
  isActive?: boolean;
  isSystem?: boolean;
  requiresReview?: boolean;
};

// Simple slugify helper
const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Ensure slug is unique; append suffix if needed
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug || "module";
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.module.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) return slug;
    slug = `${baseSlug || "module"}-${counter++}`;
  }
}

// POST /api/modules/registry – admin creates module manually
router.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const {
        name,
        slug,
        description,
        minPlan,
        isActive,
        isSystem,
        requiresReview,
      } = req.body as RegistryRequest;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      // Validate / default plan
      const validPlans = Object.values(PlanTier) as string[];
      const finalPlan: PlanTier =
        (minPlan && (validPlans as string[]).includes(minPlan)) ||
        !minPlan
          ? (minPlan || PlanTier.FREE)
          : PlanTier.FREE;

      const baseSlug = slug && slug.length > 0 ? slugify(slug) : slugify(name);
      const uniqueSlug = await ensureUniqueSlug(baseSlug);

      const newModule = await prisma.module.create({
        data: {
          name,
          slug: uniqueSlug,
          description: description || null,
          minPlan: finalPlan,
          isActive: isActive ?? true,
          isSystem: isSystem ?? false,
          requiresReview: requiresReview ?? true,
          configSchema: null,
          dependencies: [],
          createdBy: {
            connect: { id: user.id },
          },
        },
      });

      return res.status(201).json(newModule);
    } catch (err) {
      console.error("Error in POST /api/modules/registry:", err);
      return res.status(500).json({ message: "Failed to create module" });
    }
  }
);

export default router;


