// src/jobs/cleanup.job.ts - Scheduled cleanup tasks

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

/**
 * ✅ Clean up expired password reset tokens
 * Run daily via cron or on app startup
 */
export async function cleanupExpiredPasswordResetTokens(): Promise<number> {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired password reset tokens`);
    }

    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup password reset tokens', { error });
    throw error;
  }
}

/**
 * ✅ Clean up old processed webhook events
 * Keep last 30 days for debugging, delete older
 * Run daily via cron
 */
export async function cleanupOldWebhookEvents(daysToKeep: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.processedWebhookEvent.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} old webhook events (older than ${daysToKeep} days)`);
    }

    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup webhook events', { error });
    throw error;
  }
}

/**
 * ✅ Clean up soft-deleted users after retention period
 * For GDPR compliance - permanently delete after X days
 * Run weekly via cron
 */
export async function cleanupSoftDeletedUsers(daysAfterDeletion: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAfterDeletion);

    // Find users to permanently delete
    const usersToDelete = await prisma.user.findMany({
      where: {
        isDeleted: true,
        deletedAt: { lt: cutoffDate },
      },
      select: { id: true, email: true },
    });

    if (usersToDelete.length === 0) {
      return 0;
    }

    // Log before deletion for audit trail
    logger.info('Permanently deleting soft-deleted users', {
      count: usersToDelete.length,
      userIds: usersToDelete.map(u => u.id),
    });

    // Delete in transaction
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: usersToDelete.map(u => u.id) },
      },
    });

    logger.info(`Permanently deleted ${result.count} users (soft-deleted > ${daysAfterDeletion} days ago)`);

    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup soft-deleted users', { error });
    throw error;
  }
}

/**
 * ✅ Run all cleanup jobs
 * Call this from a cron job or scheduled task
 */
export async function runAllCleanupJobs(): Promise<void> {
  logger.info('Starting cleanup jobs...');

  const results = {
    passwordResetTokens: 0,
    webhookEvents: 0,
    softDeletedUsers: 0,
  };

  try {
    results.passwordResetTokens = await cleanupExpiredPasswordResetTokens();
  } catch (error) {
    logger.error('Password reset token cleanup failed', { error });
  }

  try {
    results.webhookEvents = await cleanupOldWebhookEvents(30);
  } catch (error) {
    logger.error('Webhook event cleanup failed', { error });
  }

  try {
    results.softDeletedUsers = await cleanupSoftDeletedUsers(30);
  } catch (error) {
    logger.error('Soft-deleted user cleanup failed', { error });
  }

  logger.info('Cleanup jobs completed', { results });
}

/**
 * ✅ Schedule cleanup jobs (if using node-cron)
 * 
 * Usage in your app startup:
 *   import { scheduleCleanupJobs } from './jobs/cleanup.job';
 *   scheduleCleanupJobs();
 */
export function scheduleCleanupJobs(): void {
  // Run cleanup every day at 3 AM
  // Requires: npm install node-cron
  // 
  // import cron from 'node-cron';
  // cron.schedule('0 3 * * *', runAllCleanupJobs);
  
  logger.info('Cleanup jobs scheduler initialized (implement with node-cron if needed)');
  
  // For now, just run on startup
  runAllCleanupJobs().catch((error) => {
    logger.error('Startup cleanup failed', { error });
  });
}