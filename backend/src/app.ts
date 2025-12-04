// src/app.ts

import express from 'express';
import cors from 'cors';

// ===== ROUTES =====
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';

// ===== CREATE APP =====
export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Public Auth Routes (Register + Login)
  app.use('/api/auth', authRouter);

  // Protected User Routes (requires JWT)
  app.use('/api/user', userRouter);

  return app;
}