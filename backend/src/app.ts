// src/app.ts

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import modulesRouter from './routes/modules';
import billingRouter from './routes/billing.routes';
import stripeWebhookRouter from './routes/stripe.webhooks';

const app = express();

/**
 * ✅ CRITICAL: Stripe webhooks MUST be mounted BEFORE express.json()
 * This preserves the raw request body for signature verification.
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
 * ✅ Health Check
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
app.use('/api/billing', billingRouter); // ✅ THIS IS REQUIRED

export default app;


















