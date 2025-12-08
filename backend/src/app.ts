// src/app.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import modulesRouter from './routes/modules';
import stripeWebhookRouter from './routes/stripe.webhooks';

const app = express();

// ✅ IMPORTANT: Stripe must be mounted BEFORE express.json()
app.use('/api/webhooks', stripeWebhookRouter);

// ✅ Normal middleware AFTER
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/modules', modulesRouter);

export default app;















