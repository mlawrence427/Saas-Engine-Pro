// ============================================================
// src/server.ts - SaaS Engine Pro
// Server Entry Point
// ============================================================

import app, { initializeApp } from './app';
import { disconnectPrisma } from './prismaClient';

// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

const optionalEnvVars = [
  'NODE_ENV',
  'PORT',
  'CORS_ORIGIN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

function validateEnvironment(): void {
  const missing: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    process.exit(1);
  }

  // Warn about optional but recommended vars
  if (process.env.NODE_ENV === 'production') {
    const missingOptional = optionalEnvVars.filter(
      (v) => !process.env[v] && v !== 'NODE_ENV' && v !== 'PORT'
    );
    if (missingOptional.length > 0) {
      console.warn('⚠️  Missing optional environment variables:');
      missingOptional.forEach((v) => console.warn(`   - ${v}`));
    }
  }
}

// ============================================================
// SERVER STARTUP
// ============================================================

const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer(): Promise<void> {
  try {
    // Validate environment
    validateEnvironment();
    console.log('✅ Environment validated');

    // Initialize app (database connection, etc.)
    await initializeApp();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log('─'.repeat(50));
      console.log(`🚀 SaaS Engine Pro API Server`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port: ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log('─'.repeat(50));
    });

    // --------------------------------------------------------
    // GRACEFUL SHUTDOWN
    // --------------------------------------------------------
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        console.log('✅ HTTP server closed');

        // Disconnect Prisma
        await disconnectPrisma();

        console.log('✅ Graceful shutdown complete');
        process.exit(0);
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

