// src/modules/module.service.ts - PRODUCTION IMPLEMENTATION

import { PlanTier } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// ✅ Plan hierarchy for comparison
const PLAN_HIERARCHY: Record<PlanTier, number> = {
  FREE: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

// ✅ Get plans at or below a given level
function getAccessiblePlans(userPlan: PlanTier): PlanTier[] {
  const userLevel = PLAN_HIERARCHY[userPlan];
  return (Object.entries(PLAN_HIERARCHY) as [PlanTier, number][])
    .filter(([_, level]) => level <= userLevel)
    .map(([plan]) => plan);
}

export const moduleService = {
  /**
   * Get all available modules (admin use)
   */
  async getModules() {
    return prisma.module.findMany({
      where: {
        isArchived: false,
        enabled: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Get all modules including archived (admin use)
   */
  async getAllModules(includeArchived: boolean = false) {
    return prisma.module.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
    });
  },

  /**
   * Get module by slug (returns latest version)
   */
  async getModuleBySlug(slug: string) {
    return prisma.module.findFirst({
      where: {
        slug,
        isArchived: false,
        enabled: true,
      },
      orderBy: { version: 'desc' },
    });
  },

  /**
   * Get module by ID
   */
  async getModuleById(moduleId: string) {
    return prisma.module.findUnique({
      where: { id: moduleId },
    });
  },

  /**
   * Get module by key
   */
  async getModuleByKey(key: string) {
    return prisma.module.findUnique({
      where: { key },
    });
  },

  /**
   * ✅ CRITICAL: Get all modules a user can access
   * Based on:
   * 1. User's plan >= Module's minPlan
   * 2. OR explicit ModuleAccess grant (for special access)
   */
  async getUserModules(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true, role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // FOUNDER/ADMIN get all modules
    if (user.role === 'FOUNDER' || user.role === 'ADMIN') {
      return prisma.module.findMany({
        where: {
          isArchived: false,
          enabled: true,
        },
        orderBy: { name: 'asc' },
      });
    }

    const accessiblePlans = getAccessiblePlans(user.plan);

    // Get modules where: plan allows access OR explicit grant exists
    const modules = await prisma.module.findMany({
      where: {
        isArchived: false,
        enabled: true,
        OR: [
          // Plan-based access
          { minPlan: { in: accessiblePlans } },
          // Explicit access grant (overrides plan requirement)
          {
            moduleAccesses: {
              some: { userId },
            },
          },
        ],
      },
      orderBy: { name: 'asc' },
    });

    return modules;
  },

  /**
   * ✅ CRITICAL: Check if user can access a specific module
   */
  async canAccessModule(userId: string, moduleId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true, role: true },
    });

    if (!user) {
      logger.warn('canAccessModule: User not found', { userId, moduleId });
      return false;
    }

    // FOUNDER/ADMIN bypass all checks
    if (user.role === 'FOUNDER' || user.role === 'ADMIN') {
      return true;
    }

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        moduleAccesses: {
          where: { userId },
          take: 1,
        },
      },
    });

    if (!module) {
      logger.warn('canAccessModule: Module not found', { userId, moduleId });
      return false;
    }

    if (module.isArchived || !module.enabled) {
      logger.debug('canAccessModule: Module archived or disabled', { userId, moduleId });
      return false;
    }

    // Check explicit access grant first (highest priority)
    if (module.moduleAccesses.length > 0) {
      return true;
    }

    // Check plan-based access
    const userLevel = PLAN_HIERARCHY[user.plan];
    const requiredLevel = PLAN_HIERARCHY[module.minPlan];

    return userLevel >= requiredLevel;
  },

  /**
   * ✅ Check access by module slug
   */
  async canAccessModuleBySlug(userId: string, slug: string): Promise<boolean> {
    const module = await this.getModuleBySlug(slug);
    if (!module) return false;
    return this.canAccessModule(userId, module.id);
  },

  /**
   * ✅ Check access by module key
   */
  async canAccessModuleByKey(userId: string, key: string): Promise<boolean> {
    const module = await this.getModuleByKey(key);
    if (!module) return false;
    return this.canAccessModule(userId, module.id);
  },

  /**
   * Grant explicit module access to a user (admin action)
   * Use for: beta access, special grants, grandfathering
   */
  async enableModule(userId: string, moduleId: string, grantedByUserId?: string) {
    // Verify module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new Error('Module not found');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const access = await prisma.moduleAccess.upsert({
      where: {
        userId_moduleId: { userId, moduleId },
      },
      create: { userId, moduleId },
      update: {}, // No-op if already exists
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'ACCESS_GRANTED',
        entityType: 'MODULE',
        entityId: moduleId,
        performedByUserId: grantedByUserId ?? null,
        metadata: {
          userId,
          moduleId,
          moduleKey: module.key,
          moduleName: module.name,
        },
      },
    });

    logger.info('Module access granted', {
      userId,
      moduleId,
      moduleKey: module.key,
      grantedBy: grantedByUserId,
    });

    return access;
  },

  /**
   * Revoke explicit module access from a user (admin action)
   */
  async disableModule(userId: string, moduleId: string, revokedByUserId?: string) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    try {
      await prisma.moduleAccess.delete({
        where: {
          userId_moduleId: { userId, moduleId },
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: 'ACCESS_REVOKED',
          entityType: 'MODULE',
          entityId: moduleId,
          performedByUserId: revokedByUserId ?? null,
          metadata: {
            userId,
            moduleId,
            moduleKey: module?.key,
            moduleName: module?.name,
          },
        },
      });

      logger.info('Module access revoked', {
        userId,
        moduleId,
        moduleKey: module?.key,
        revokedBy: revokedByUserId,
      });

      return { success: true };
    } catch (error) {
      // Handle case where access didn't exist
      if ((error as any)?.code === 'P2025') {
        logger.debug('Module access did not exist', { userId, moduleId });
        return { success: true, alreadyRevoked: true };
      }
      throw error;
    }
  },

  /**
   * Get all explicit access grants for a user
   */
  async getUserExplicitAccess(userId: string) {
    return prisma.moduleAccess.findMany({
      where: { userId },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            slug: true,
            key: true,
            minPlan: true,
          },
        },
      },
    });
  },

  /**
   * Get all users with explicit access to a module
   */
  async getModuleAccessList(moduleId: string) {
    return prisma.moduleAccess.findMany({
      where: { moduleId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * ✅ Get modules with access status for UI display
   * Returns all modules with a flag indicating if user can access
   */
  async getModulesWithAccessStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true, role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isAdmin = user.role === 'FOUNDER' || user.role === 'ADMIN';
    const userLevel = PLAN_HIERARCHY[user.plan];

    const modules = await prisma.module.findMany({
      where: {
        isArchived: false,
        enabled: true,
      },
      include: {
        moduleAccesses: {
          where: { userId },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return modules.map((module) => {
      const hasExplicitAccess = module.moduleAccesses.length > 0;
      const hasPlanAccess = userLevel >= PLAN_HIERARCHY[module.minPlan];
      const canAccess = isAdmin || hasExplicitAccess || hasPlanAccess;

      return {
        id: module.id,
        name: module.name,
        slug: module.slug,
        key: module.key,
        description: module.description,
        category: module.category,
        icon: module.icon,
        minPlan: module.minPlan,
        canAccess,
        accessReason: isAdmin
          ? 'admin'
          : hasExplicitAccess
          ? 'explicit_grant'
          : hasPlanAccess
          ? 'plan'
          : null,
        requiredPlan: canAccess ? null : module.minPlan,
      };
    });
  },
};

/**
 * Named export for backwards compatibility
 */
export const listModulesForUser = async (
  user: string | { id: string; plan?: unknown; role?: unknown }
): Promise<ReturnType<typeof moduleService.getUserModules>> => {
  const userId = typeof user === 'string' ? user : user.id;
  return moduleService.getUserModules(userId);
};

export default moduleService;

