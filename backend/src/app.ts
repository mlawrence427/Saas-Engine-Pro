// src/app.ts

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import modulesRouter from './routes/modules';
import stripeWebhookRouter from './routes/stripe.webhooks';

const app = express();

/**
 * ✅ Stripe Webhooks MUST be mounted BEFORE express.json()
 * This preserves the raw body for signature verification.
 */
app.use('/api/webhooks', stripeWebhookRouter);

/**
 * ✅ Normal middleware AFTER webhooks
 */
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/**
 * ✅ Health check
 */
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

/**
 * ✅ Core API Routes
 */
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/modules', modulesRouter);

export default app;
















