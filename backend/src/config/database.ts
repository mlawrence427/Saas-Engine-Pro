import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// ============================================
// PRISMA CLIENT SINGLETON
// ============================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ============================================
// LIFECYCLE MANAGEMENT
// ============================================

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log('📦 Database disconnected');
};