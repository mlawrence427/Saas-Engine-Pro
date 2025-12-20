// backend/src/config/env.ts
// Environment configuration with validation (loads .env deterministically)

import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

// Load .env from the current working directory (you run: ...\backend> npm run dev)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Auth / JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // URLs
  APP_URL: z.string().url("APP_URL must be a valid URL"),
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Founder + AI (optional)
  FOUNDER_SEED_PHRASE: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Stripe core
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  STRIPE_API_VERSION: z.literal("2023-10-16").default("2023-10-16"),

  // Stripe price IDs (optional)
  STRIPE_PRICE_ID: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env: Env = parseResult.data;

// Backwards-compatible config object for older code that imports { config }
export const config = {
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    apiVersion: env.STRIPE_API_VERSION,
    prices: {
      default: env.STRIPE_PRICE_ID ?? "",
      pro: env.STRIPE_PRICE_PRO ?? "",
      enterprise: env.STRIPE_PRICE_ENTERPRISE ?? "",
    },
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  app: {
    url: env.APP_URL,
    frontendUrl: env.FRONTEND_URL,
    env: env.NODE_ENV,
    port: env.PORT,
  },
};



