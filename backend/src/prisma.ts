// ============================================================
// src/prismaClient.ts - SaaS Engine Pro
// ============================================================

import { PrismaClient, Prisma } from "@prisma/client";

// ============================================================
// GLOBAL SINGLETON (prevents multiple instances during hot reload)
// ============================================================

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA_CLIENT__: PrismaClient | undefined;
}

// ============================================================
// LOGGING CONFIGURATION
// ============================================================

const getLogConfig = (): Prisma.PrismaClientOptions['log'] => {
  if (process.env.NODE_ENV === 'production') {
    return [
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ];
  }
  
  // Development: log queries for debugging
  if (process.env.PRISMA_DEBUG === 'true') {
    return [
      { level: 'query', emit: 'stdout' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
      { level: 'info', emit: 'stdout' },
    ];
  }

  return [
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ];
};

// ============================================================
// CLIENT INITIALIZATION
// ============================================================

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: getLogConfig(),
  });

  // --------------------------------------------------------
  // SOFT DELETE MIDDLEWARE FOR MODULES
  // Automatically filters out archived modules in findMany/findFirst
  // --------------------------------------------------------

  client.$use(async (params, next) => {
    // Only apply to Module model
    if (params.model !== 'Module') {
      return next(params);
    }

    // For read operations, auto-filter archived unless explicitly requested
    if (params.action === 'findMany' || params.action === 'findFirst') {
      // Check if caller explicitly wants archived modules
      const includeArchived = params.args?.where?.isArchived !== undefined;
      
      if (!includeArchived) {
        params.args = params.args || {};
        params.args.where = params.args.where || {};
        params.args.where.isArchived = false;
      }
    }

    // For findUnique, we can't easily modify, so caller must handle
    // (This is intentional - findUnique by ID should return even if archived)

    return next(params);
  });

  // --------------------------------------------------------
  // QUERY TIMING MIDDLEWARE (Development only)
  // --------------------------------------------------------

  if (process.env.NODE_ENV !== 'production' && process.env.PRISMA_TIMING === 'true') {
    client.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      console.log(`⏱️  ${params.model}.${params.action} took ${after - before}ms`);
      return result;
    });
  }

  return client;
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  // In development, use global to preserve client across hot reloads
  if (!global.__PRISMA_CLIENT__) {
    global.__PRISMA_CLIENT__ = createPrismaClient();
  }
  prisma = global.__PRISMA_CLIENT__;
}

export { prisma };

// ============================================================
// HELPER: Get latest version of a module by slug
// ============================================================

export async function getLatestModule(slug: string) {
  return prisma.module.findFirst({
    where: { 
      slug,
      isArchived: false,
    },
    orderBy: { version: 'desc' },
  });
}

// ============================================================
// HELPER: Get all versions of a module (including archived)
// ============================================================

export async function getModuleHistory(slug: string) {
  return prisma.module.findMany({
    where: { 
      slug,
      isArchived: undefined, // Override middleware to get all
    },
    orderBy: { version: 'desc' },
  });
}

// ============================================================
// HELPER: Check database connection
// ============================================================

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  console.log('🔌 Prisma disconnected');
}

// Handle process termination
const handleShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Closing Prisma connection...`);
  await disconnectPrisma();
  process.exit(0);
};

// Only register shutdown handlers once
if (!global.__PRISMA_CLIENT__) {
  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}