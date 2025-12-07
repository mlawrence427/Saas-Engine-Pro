// ============================================================
// src/app.ts - SaaS Engine Pro
// Express Application Configuration
// ============================================================

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';

// Database
import { prisma, checkDatabaseConnection } from './prismaClient';

// Routes
import authRouter from './routes/auth';
import adminModulesRouter from './routes/admin/modules';
import adminAIModulesRouter from './routes/admin/aiModules';
import adminUsersRouter from './routes/admin/users';
import adminAuditLogsRouter from './routes/admin/auditLogs';
import modulesRouter from './routes/modules';
import webhooksRouter from './routes/webhooks';

// ============================================================
// APP INITIALIZATION
// ============================================================

const app: Express = express();

// ============================================================
// TRUST PROXY (for rate limiting, secure cookies behind load balancer)
// ============================================================

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Request logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ============================================================
// BODY PARSING
// Note: Stripe webhooks need raw body, so we handle that separately
// ============================================================

// JSON body parser (skip for webhook routes that need raw body)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

// URL-encoded body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// HEALTH CHECK ROUTES
// ============================================================

app.get('/health', async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/health/db', async (_req: Request, res: Response) => {
  const dbConnected = await checkDatabaseConnection();
  
  if (dbConnected) {
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================
// API ROUTES
// ============================================================

// Auth routes (login, register, etc.)
app.use('/api/auth', authRouter);

// Webhook routes (Stripe, etc.) - needs raw body
app.use('/api/webhooks', webhooksRouter);

// Public module routes
app.use('/api/modules', modulesRouter);

// Admin routes
app.use('/api/admin/modules', adminModulesRouter);
app.use('/api/admin/ai-modules', adminAIModulesRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/audit-logs', adminAuditLogsRouter);

// ============================================================
// 404 HANDLER
// ============================================================

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: 'The requested resource was not found',
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

app.use((err: AppError, req: Request, res: Response, _next: NextFunction) => {
  // Log error
  console.error('Unhandled error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Prisma known errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      success: false,
      error: 'DatabaseError',
      message: 'A database error occurred',
    });
    return;
  }

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Invalid data provided',
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'AuthenticationError',
      message: 'Invalid or expired token',
    });
    return;
  }

  // Custom app errors with status code
  if (err.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      error: err.code || 'Error',
      message: err.message,
    });
    return;
  }

  // Default 500 error
  res.status(500).json({
    success: false,
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
});

// ============================================================
// GRACEFUL SHUTDOWN HELPERS
// ============================================================

export async function initializeApp(): Promise<void> {
  // Verify database connection
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    throw new Error('Failed to connect to database');
  }
  console.log('✅ Database connected');
}

export default app;












