// ============================================================
// src/routes/admin/aiModules.ts - SaaS Engine Pro
// AI Module Draft Governance Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../../prismaClient';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { 
  AIDraftStatus, 
  AuditAction, 
  AuditEntityType, 
  PlanTier,
  Role,
  Module,
  AIModuleDraft,
} from '@prisma/client';

const router = Router();

// ============================================================
// TYPES
// ============================================================

interface PermissionsPreview {
  minPlan?: PlanTier | string;
  requiredRoles?: string[];
}

interface ApprovalResult {
  module: Module;
  draft: AIModuleDraft;
  isNewModule: boolean;
  previousVersion?: number;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Generates a URL-safe slug from the draft title.
 * Used when creating a new module from a draft without targetModuleSlug.
 */
function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .substring(0, 64);             // Limit length
}

/**
 * Extracts minPlan from draft.permissionsPreview.
 * Defaults to FREE if not specified or invalid.
 */
function extractMinPlan(permissionsPreview: unknown): PlanTier {
  if (!permissionsPreview || typeof permissionsPreview !== 'object') {
    return PlanTier.FREE;
  }

  const preview = permissionsPreview as PermissionsPreview;
  const minPlan = preview.minPlan;

  // Validate it's a valid PlanTier
  if (minPlan && Object.values(PlanTier).includes(minPlan as PlanTier)) {
    return minPlan as PlanTier;
  }

  return PlanTier.FREE;
}

// ============================================================
// POST /api/admin/ai-modules/:id/approve
// Approve an AI-generated module draft
// ============================================================

router.post(
  '/:id/approve',
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { id: draftId } = req.params;
    const adminUserId = req.user!.id;
    const reviewNote = req.body.reviewNote as string | undefined;

    try {
      // ========================================================
      // EXECUTE APPROVAL IN TRANSACTION
      // ========================================================
      const result = await prisma.$transaction(async (tx) => {
        // ------------------------------------------------------
        // 1. FETCH AND VALIDATE DRAFT
        // ------------------------------------------------------
        const draft = await tx.aIModuleDraft.findUnique({
          where: { id: draftId },
        });

        if (!draft) {
          throw new AppError(404, 'DraftNotFound', 'AI module draft not found');
        }

        if (draft.status !== AIDraftStatus.PENDING) {
          throw new AppError(
            400, 
            'DraftNotPending', 
            `Draft has already been ${draft.status.toLowerCase()}`
          );
        }

        // ------------------------------------------------------
        // 2. DETERMINE: NEW MODULE vs VERSION UPDATE
        // ------------------------------------------------------
        const isNewModule = !draft.targetModuleSlug;
        let newModule: Module;
        let archivedModule: Module | null = null;

        if (isNewModule) {
          // --------------------------------------------------
          // CASE A: Create brand new module
          // --------------------------------------------------
          const slug = generateSlugFromTitle(draft.title);
          const minPlan = extractMinPlan(draft.permissionsPreview);

          // Check slug doesn't already exist (version 1)
          const existingModule = await tx.module.findUnique({
            where: { slug_version: { slug, version: 1 } },
          });

          if (existingModule) {
            throw new AppError(
              409, 
              'SlugConflict', 
              `A module with slug "${slug}" already exists. Set targetModuleSlug to update it.`
            );
          }

          // Create the module
          newModule = await tx.module.create({
            data: {
              name: draft.title,
              slug,
              description: draft.description,
              minPlan,
              version: 1,
              isArchived: false,
              publishedAt: new Date(),
              publishedByUserId: adminUserId,
              sourceAIDraftId: draft.id,
            },
          });

          // Audit: MODULE_CREATED
          await tx.auditLog.create({
            data: {
              action: AuditAction.MODULE_CREATED,
              entityType: AuditEntityType.MODULE,
              entityId: newModule.id,
              performedByUserId: adminUserId,
              metadata: {
                slug: newModule.slug,
                version: newModule.version,
                minPlan: newModule.minPlan,
                sourceAIDraftId: draft.id,
                sourceAIDraftTitle: draft.title,
              },
            },
          });

        } else {
          // --------------------------------------------------
          // CASE B: Version update to existing module
          // --------------------------------------------------
          const targetSlug = draft.targetModuleSlug!;

          // Find the latest active version of the target module
          const currentModule = await tx.module.findFirst({
            where: {
              slug: targetSlug,
              isArchived: false,
            },
            orderBy: { version: 'desc' },
          });

          if (!currentModule) {
            throw new AppError(
              404,
              'TargetModuleNotFound',
              `No active module found with slug "${targetSlug}"`
            );
          }

          const newVersion = currentModule.version + 1;
          const minPlan = extractMinPlan(draft.permissionsPreview) || currentModule.minPlan;

          // Archive the current version
          archivedModule = await tx.module.update({
            where: { id: currentModule.id },
            data: { isArchived: true },
          });

          // Audit: MODULE_ARCHIVED
          await tx.auditLog.create({
            data: {
              action: AuditAction.MODULE_ARCHIVED,
              entityType: AuditEntityType.MODULE,
              entityId: archivedModule.id,
              performedByUserId: adminUserId,
              metadata: {
                slug: archivedModule.slug,
                version: archivedModule.version,
                reason: 'Superseded by new version',
                newVersion,
                sourceAIDraftId: draft.id,
              },
            },
          });

          // Create new version
          newModule = await tx.module.create({
            data: {
              name: draft.title || currentModule.name,
              slug: targetSlug,
              description: draft.description || currentModule.description,
              minPlan,
              version: newVersion,
              isArchived: false,
              publishedAt: new Date(),
              publishedByUserId: adminUserId,
              sourceAIDraftId: draft.id,
            },
          });

          // Audit: MODULE_VERSION_CREATED
          await tx.auditLog.create({
            data: {
              action: AuditAction.MODULE_VERSION_CREATED,
              entityType: AuditEntityType.MODULE,
              entityId: newModule.id,
              performedByUserId: adminUserId,
              metadata: {
                slug: newModule.slug,
                version: newModule.version,
                previousVersion: archivedModule.version,
                previousModuleId: archivedModule.id,
                minPlan: newModule.minPlan,
                sourceAIDraftId: draft.id,
                sourceAIDraftTitle: draft.title,
              },
            },
          });
        }

        // ------------------------------------------------------
        // 3. UPDATE DRAFT STATUS
        // ------------------------------------------------------
        const updatedDraft = await tx.aIModuleDraft.update({
          where: { id: draftId },
          data: {
            status: AIDraftStatus.APPROVED,
            reviewedAt: new Date(),
            reviewedByUserId: adminUserId,
            reviewNote: reviewNote || null,
          },
        });

        // ------------------------------------------------------
        // 4. AUDIT: MODULE_APPROVED (draft approval)
        // ------------------------------------------------------
        await tx.auditLog.create({
          data: {
            action: AuditAction.MODULE_APPROVED,
            entityType: AuditEntityType.AIDRAFT,
            entityId: draft.id,
            performedByUserId: adminUserId,
            metadata: {
              draftTitle: draft.title,
              resultingModuleId: newModule.id,
              resultingModuleSlug: newModule.slug,
              resultingModuleVersion: newModule.version,
              isNewModule,
              reviewNote: reviewNote || null,
            },
          },
        });

        // ------------------------------------------------------
        // 5. RETURN RESULT
        // ------------------------------------------------------
        return {
          module: newModule,
          draft: updatedDraft,
          isNewModule,
          previousVersion: archivedModule?.version,
        } as ApprovalResult;
      });

      // ========================================================
      // SUCCESS RESPONSE
      // ========================================================
      res.status(200).json({
        success: true,
        message: result.isNewModule 
          ? `Module "${result.module.name}" created successfully`
          : `Module "${result.module.name}" updated to version ${result.module.version}`,
        data: {
          module: {
            id: result.module.id,
            name: result.module.name,
            slug: result.module.slug,
            version: result.module.version,
            minPlan: result.module.minPlan,
            publishedAt: result.module.publishedAt,
          },
          draft: {
            id: result.draft.id,
            title: result.draft.title,
            status: result.draft.status,
            reviewedAt: result.draft.reviewedAt,
          },
          isNewModule: result.isNewModule,
          previousVersion: result.previousVersion || null,
        },
      });

    } catch (error) {
      // ========================================================
      // ERROR HANDLING
      // ========================================================
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Approval error:', error);
      res.status(500).json({
        success: false,
        error: 'ApprovalFailed',
        message: 'Failed to approve module draft',
      });
    }
  }
);

// ============================================================
// POST /api/admin/ai-modules/:id/reject
// Reject an AI-generated module draft
// ============================================================

router.post(
  '/:id/reject',
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { id: draftId } = req.params;
    const adminUserId = req.user!.id;
    const { reviewNote } = req.body;

    if (!reviewNote || typeof reviewNote !== 'string' || reviewNote.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'ReviewNoteRequired',
        message: 'A review note explaining the rejection is required',
      });
      return;
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Fetch and validate draft
        const draft = await tx.aIModuleDraft.findUnique({
          where: { id: draftId },
        });

        if (!draft) {
          throw new AppError(404, 'DraftNotFound', 'AI module draft not found');
        }

        if (draft.status !== AIDraftStatus.PENDING) {
          throw new AppError(
            400,
            'DraftNotPending',
            `Draft has already been ${draft.status.toLowerCase()}`
          );
        }

        // Update draft status
        const updatedDraft = await tx.aIModuleDraft.update({
          where: { id: draftId },
          data: {
            status: AIDraftStatus.REJECTED,
            reviewedAt: new Date(),
            reviewedByUserId: adminUserId,
            reviewNote: reviewNote.trim(),
          },
        });

        // Audit: MODULE_REJECTED
        await tx.auditLog.create({
          data: {
            action: AuditAction.MODULE_REJECTED,
            entityType: AuditEntityType.AIDRAFT,
            entityId: draft.id,
            performedByUserId: adminUserId,
            metadata: {
              draftTitle: draft.title,
              targetModuleSlug: draft.targetModuleSlug,
              reviewNote: reviewNote.trim(),
            },
          },
        });

        return updatedDraft;
      });

      res.status(200).json({
        success: true,
        message: `Draft "${result.title}" has been rejected`,
        data: {
          draft: {
            id: result.id,
            title: result.title,
            status: result.status,
            reviewedAt: result.reviewedAt,
            reviewNote: result.reviewNote,
          },
        },
      });

    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Rejection error:', error);
      res.status(500).json({
        success: false,
        error: 'RejectionFailed',
        message: 'Failed to reject module draft',
      });
    }
  }
);

// ============================================================
// GET /api/admin/ai-modules
// List all AI module drafts (with filtering)
// ============================================================

router.get(
  '/',
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { status, limit = '20', offset = '0' } = req.query;

    try {
      const where: { status?: AIDraftStatus } = {};
      
      if (status && Object.values(AIDraftStatus).includes(status as AIDraftStatus)) {
        where.status = status as AIDraftStatus;
      }

      const [drafts, total] = await Promise.all([
        prisma.aIModuleDraft.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Math.min(parseInt(limit as string, 10) || 20, 100),
          skip: parseInt(offset as string, 10) || 0,
          include: {
            createdByUser: {
              select: { id: true, email: true },
            },
            resultingModules: {
              select: { id: true, slug: true, version: true },
              where: { isArchived: false },
            },
          },
        }),
        prisma.aIModuleDraft.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          drafts,
          pagination: {
            total,
            limit: parseInt(limit as string, 10) || 20,
            offset: parseInt(offset as string, 10) || 0,
          },
        },
      });

    } catch (error) {
      console.error('List drafts error:', error);
      res.status(500).json({
        success: false,
        error: 'ListFailed',
        message: 'Failed to list module drafts',
      });
    }
  }
);

// ============================================================
// GET /api/admin/ai-modules/:id
// Get single AI module draft details
// ============================================================

router.get(
  '/:id',
  requireAuth,
  requireRole(Role.ADMIN, Role.FOUNDER),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const draft = await prisma.aIModuleDraft.findUnique({
        where: { id },
        include: {
          createdByUser: {
            select: { id: true, email: true },
          },
          resultingModules: {
            select: { 
              id: true, 
              name: true,
              slug: true, 
              version: true, 
              publishedAt: true,
              isArchived: true,
            },
            orderBy: { version: 'desc' },
          },
        },
      });

      if (!draft) {
        res.status(404).json({
          success: false,
          error: 'DraftNotFound',
          message: 'AI module draft not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { draft },
      });

    } catch (error) {
      console.error('Get draft error:', error);
      res.status(500).json({
        success: false,
        error: 'GetFailed',
        message: 'Failed to get module draft',
      });
    }
  }
);

// ============================================================
// CUSTOM ERROR CLASS
// ============================================================

class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export default router;