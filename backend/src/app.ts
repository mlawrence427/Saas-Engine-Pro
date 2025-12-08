// src/app.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import modulesRouter from './routes/modules';
import { stripeWebhookHandler } from './routes/stripe.webhooks';

const app = express();

// JSON + cookies
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Auth & user
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

// Modules registry (read-only public for now)
app.use('/api/modules', modulesRouter);

// Stripe webhook (raw body)
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

export default app;














