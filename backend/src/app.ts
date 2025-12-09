// src/app.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import modulesRouter from './routes/modules';
import stripeWebhookRouter from './routes/stripe.webhooks';
import billingRouter from './routes/billing.routes';
import protectedRouter from './routes/protected.routes';

const app = express();

/**
 * ✅ IMPORTANT:
 * Stripe webhooks must be mounted BEFORE express.json()
 * so that the raw request body is available for signature verification.
 */
app.use('/api/webhooks', stripeWebhookRouter);

// ✅ Normal middleware AFTER webhooks
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

// Billing + subscription control (checkout, portal, sync, me)
app.use('/api/billing', billingRouter);

// Demo protected routes (plan-gated endpoints)
app.use('/api/protected', protectedRouter);

export default app;



















