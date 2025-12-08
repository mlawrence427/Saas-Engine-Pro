import { prisma } from '../config/database.js';
import type { AuditLogData } from '../types/index.js';

// ============================================
// AUDIT SERVICE
// ============================================

export const AuditService = {
  /**
   * Log an action for audit trail
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details ?? undefined,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      console.error('Failed to create audit log:', error);
    }
  },

  /**
   * Log user actions
   */
  async logUserAction(
    userId: string,
    action: string,
    details?: Record<string, unknown>,
    request?: { ip?: string; headers?: { 'user-agent'?: string } }
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'user',
      resourceId: userId,
      details,
      ipAddress: request?.ip,
      userAgent: request?.headers?.['user-agent'],
    });
  },

  /**
   * Log module actions
   */
  async logModuleAction(
    userId: string | undefined,
    action: string,
    moduleId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'module',
      resourceId: moduleId,
      details,
    });
  },

  /**
   * Log AI draft actions
   */
  async logDraftAction(
    userId: string | undefined,
    action: string,
    draftId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'ai_draft',
      resourceId: draftId,
      details,
    });
  },

  /**
   * Log billing actions
   */
  async logBillingAction(
    userId: string,
    action: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'billing',
      resourceId: userId,
      details,
    });
  },
};