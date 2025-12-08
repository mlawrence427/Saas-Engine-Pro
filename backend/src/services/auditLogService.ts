import { prisma } from '../config/database';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';

type AuditMetadata = Prisma.InputJsonValue;

export async function createAuditLog(opts: {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  performedByUserId?: string | null;
  metadata?: AuditMetadata;
}) {
  const { action, entityType, entityId, performedByUserId, metadata } = opts;

  return prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      performedByUserId: performedByUserId ?? null,
      metadata,
    },
  });
}
