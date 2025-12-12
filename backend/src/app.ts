// backend/src/app.ts

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import authRoutes from './routes/auth';
import billingRoutes from './routes/billing.routes'; // if present
// import other route files as needed...

const app = express();

// -----------------------------------------------------------
// CORS – allow Next.js frontend (http://localhost:3000)
// to send credentials (cookies) to backend (http://localhost:4000)
// -----------------------------------------------------------

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true, // allow cookies
  })
);

// -----------------------------------------------------------
// Global middleware
// -----------------------------------------------------------

app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));

// -----------------------------------------------------------
// Health check
// -----------------------------------------------------------

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// -----------------------------------------------------------
// API routes
// -----------------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes); // if you have this

// TODO: attach error-handling middleware if you have it
// import { errorHandler } from './middleware/error-handler';
// app.use(errorHandler);

export default app;





















