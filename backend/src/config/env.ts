// src/config/env.ts

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth / JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // URLs
  APP_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Founder + AI
  FOUNDER_SEED_PHRASE: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Stripe core
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_API_VERSION: z
    .literal('2023-10-16')
    .default('2023-10-16'),

  // Stripe price IDs (optional – you can wire these later)
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

// Backwards-compatible config object for older code that imports { config }
export const config = {
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    apiVersion: env.STRIPE_API_VERSION,
    prices: {
      pro: env.STRIPE_PRICE_PRO ?? '',
      enterprise: env.STRIPE_PRICE_ENTERPRISE ?? '',
    },
  },
};


