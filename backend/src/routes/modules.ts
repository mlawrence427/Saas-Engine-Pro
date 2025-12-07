// ============================================================
// src/routes/modules.ts - SaaS Engine Pro
// Public Module Routes (for authenticated users)
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma, getLatestModule } from '../prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { hasPlanAccess } from '../middleware/requirePlan';

const router = Router();

// ============================================================
// GET /api/modules
// List all available modules (filtered by user's plan)
// ============================================================

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userPlan = req.user!.plan;

    // Get all non-archived modules
    // Soft delete middleware auto-filters isArchived = false
    const modules = await prisma.module.findMany({
      orderBy: [
        { slug: 'asc' },
        { version: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        minPlan: true,
        version: true,
        publishedAt: true,
      },
    });

    // Get unique latest versions only
    const latestModules = new Map<string, typeof modules[0]>();
    for (const mod of modules) {
      if (!latestModules.has(mod.slug)) {
        latestModules.set(mod.slug, mod);
      }
    }

    // Add access info based on user's plan
    const modulesWithAccess = Array.from(latestModules.values()).map((mod) => ({
      ...mod,
      hasAccess: hasPlanAccess(userPlan, mod.minPlan),
    }));

    res.status(200).json({
      success: true,
      data: {
        modules: modulesWithAccess,
        userPlan,
      },
    });

  } catch (error) {
    console.error('List modules error:', error);
    res.status(500).json({
      success: false,
      error: 'ListFailed',
      message: 'Failed to list modules',
    });
  }
});

// ============================================================
// GET /api/modules/:slug
// Get a specific module by slug
// ============================================================

router.get('/:slug', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;

  try {
    const module = await getLatestModule(slug);

    if (!module) {
      res.status(404).json({
        success: false,
        error: 'ModuleNotFound',
        message: `Module "${slug}" not found`,
      });
      return;
    }

    const hasAccess = hasPlanAccess(req.user!.plan, module.minPlan);

    res.status(200).json({
      success: true,
      data: {
        module: {
          id: module.id,
          name: module.name,
          slug: module.slug,
          description: module.description,
          minPlan: module.minPlan,
          version: module.version,
          publishedAt: module.publishedAt,
        },
        hasAccess,
        requiredPlan: hasAccess ? null : module.minPlan,
      },
    });

  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({
      success: false,
      error: 'GetFailed',
      message: 'Failed to get module',
    });
  }
});

export default router;