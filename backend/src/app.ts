import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import apiRoutes from './api';
import { billingController } from './controllers';
import { 
  errorHandler, 
  notFoundHandler, 
  asyncHandler 
} from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// ==============================================
// Create Express App
// ==============================================
export function createApp(): Express {
  const app = express();

  // ==============================================
  // Security Middleware
  // ==============================================
  
  // Helmet - Security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
      error: true,
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // ==============================================
  // Request Logging
  // ==============================================
  app.use(requestLogger);

  // ==============================================
  // Body Parsing
  // ==============================================
  
  // Stripe webhook needs raw body
  app.post(
    '/api/webhook',
    express.raw({ type: 'application/json' }),
    asyncHandler(billingController.handleWebhook)
  );

  // JSON body parser for all other routes
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ==============================================
  // Trust Proxy (for rate limiting behind reverse proxy)
  // ==============================================
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // ==============================================
  // API Routes
  // ==============================================
  app.use('/api', apiRoutes);

  // ==============================================
  // Root Route
  // ==============================================
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'SaaSify API',
      version: '1.0.0',
      documentation: '/api/health',
      status: 'running',
    });
  });

  // ==============================================
  // Error Handling
  // ==============================================
  
  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
