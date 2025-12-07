// ============================================================
// src/routes/admin/modules.ts - SaaS Engine Pro
// Admin Module Management Routes
// ============================================================

import { Router, Request, Response } from "express";
import { prisma, getModuleHistory } from "../../prismaClient";

// ⚠️ IMPORTANT: these are default exports, not named
import requireAuth from "../../middleware/requireAuth";
import requireRole from "../../middleware/requireRole";

import {
  Role,
  PlanTier,
  AuditAction,
  AuditEntityType,
} from "@prisma/client";

const router = Router();

// ============================================================
// GET /api/admin/modules
// List all modules (including archived) with filtering
// ============================================================

router.get(
  "/",
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { includeArchived, slug, minPlan } = req.query;

    try {
      const where: {
        isArchived?: boolean;
        slug?: string;
        minPlan?: PlanTier;
      } = {};

      // By default, show only active. Set includeArchived=true to see all
      if (includeArchived !== "true") {
        where.isArchived = false;
      }

      if (slug && typeof slug === "string") {
        where.slug = slug;
      }

      if (minPlan && Object.values(PlanTier).includes(minPlan as PlanTier)) {
        where.minPlan = minPlan as PlanTier;
      }

      const modules = await prisma.module.findMany({
        where:
          includeArchived === "true"
            ? { isArchived: undefined, ...where }
            : where,
        orderBy: [{ slug: "asc" }, { version: "desc" }],
        include: {
          publishedByUser: {
            select: { id: true, email: true },
          },
          sourceAIDraft: {
            select: { id: true, title: true },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: { modules },
      });
    } catch (error) {
      console.error("Admin list modules error:", error);
      res.status(500).json({
        success: false,
        error: "ListFailed",
        message: "Failed to list modules",
      });
    }
  }
);

// ============================================================
// GET /api/admin/modules/:slug/history
// Get version history for a module
// ============================================================

router.get(
  "/:slug/history",
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;

    try {
      const history = await getModuleHistory(slug);

      if (history.length === 0) {
        res.status(404).json({
          success: false,
          error: "ModuleNotFound",
          message: `No module found with slug "${slug}"`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          slug,
          versions: history,
          totalVersions: history.length,
          currentVersion:
            history.find((m) => !m.isArchived)?.version || null,
        },
      });
    } catch (error) {
      console.error("Get module history error:", error);
      res.status(500).json({
        success: false,
        error: "HistoryFailed",
        message: "Failed to get module history",
      });
    }
  }
);

// ============================================================
// POST /api/admin/modules
// Create a new module manually (not from AI draft)
// ============================================================

router.post(
  "/",
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { name, slug, description, minPlan = "FREE" } = req.body;
    const adminUserId = req.user!.id;

    // Validation
    if (!name || !slug) {
      res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Name and slug are required",
      });
      return;
    }

    if (!Object.values(PlanTier).includes(minPlan as PlanTier)) {
      res.status(400).json({
        success: false,
        error: "ValidationError",
        message: `Invalid minPlan. Must be one of: ${Object.values(
          PlanTier
        ).join(", ")}`,
      });
      return;
    }

    try {
      // Check if slug already exists
      const existing = await prisma.module.findUnique({
        where: { slug_version: { slug, version: 1 } },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          error: "SlugConflict",
          message: `A module with slug "${slug}" already exists`,
        });
        return;
      }

      // Create module in transaction with audit log
      const result = await prisma.$transaction(async (tx) => {
        const module = await tx.module.create({
          data: {
            name,
            slug,
            description: description || null,
            minPlan: minPlan as PlanTier,
            version: 1,
            isArchived: false,
            publishedAt: new Date(),
            publishedByUserId: adminUserId,
            sourceAIDraftId: null, // Manual creation
          },
        });

        await tx.auditLog.create({
          data: {
            action: AuditAction.MODULE_CREATED,
            entityType: AuditEntityType.MODULE,
            entityId: module.id,
            performedByUserId: adminUserId,
            metadata: {
              name: module.name,
              slug: module.slug,
              version: module.version,
              minPlan: module.minPlan,
              source: "manual",
            },
          },
        });

        return module;
      });

      res.status(201).json({
        success: true,
        message: `Module "${name}" created successfully`,
        data: { module: result },
      });
    } catch (error) {
      console.error("Create module error:", error);
      res.status(500).json({
        success: false,
        error: "CreateFailed",
        message: "Failed to create module",
      });
    }
  }
);

// ============================================================
// DELETE /api/admin/modules/:id/archive
// Archive a module (soft delete)
// ============================================================

router.delete(
  "/:id/archive",
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminUserId = req.user!.id;

    try {
      const module = await prisma.module.findUnique({
        where: { id },
      });

      if (!module) {
        res.status(404).json({
          success: false,
          error: "ModuleNotFound",
          message: "Module not found",
        });
        return;
      }

      if (module.isArchived) {
        res.status(400).json({
          success: false,
          error: "AlreadyArchived",
          message: "Module is already archived",
        });
        return;
      }

      // Archive with audit log
      const result = await prisma.$transaction(async (tx) => {
        const archived = await tx.module.update({
          where: { id },
          data: { isArchived: true },
        });

        await tx.auditLog.create({
          data: {
            action: AuditAction.MODULE_ARCHIVED,
            entityType: AuditEntityType.MODULE,
            entityId: archived.id,
            performedByUserId: adminUserId,
            metadata: {
              slug: archived.slug,
              version: archived.version,
              reason: "Manual archive by admin",
            },
          },
        });

        return archived;
      });

      res.status(200).json({
        success: true,
        message: `Module "${result.name}" archived successfully`,
        data: { module: result },
      });
    } catch (error) {
      console.error("Archive module error:", error);
      res.status(500).json({
        success: false,
        error: "ArchiveFailed",
        message: "Failed to archive module",
      });
    }
  }
);

export default router;
