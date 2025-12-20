// backend/src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";

// Webhooks MUST be mounted before express.json()
import stripeWebhookRouter from "./routes/stripe.webhooks";

// API routers
import authRouter from "./api/auth/auth.routes";
import billingRouter from "./routes/billing.routes";
import modulesRouter from "./routes/module.registry.routes";
import planTruthRouter from "./routes/plan.truth.routes";

const app = express();

// --------------------------------------------------
// Core middleware
// --------------------------------------------------

app.use(morgan("dev"));

// Required for cookie-based JWT auth
app.use(cookieParser());

// CORS — explicit, credentialed
app.use(
  cors({
    origin: env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);

// --------------------------------------------------
// Health check (deterministic, non-auth)
// --------------------------------------------------

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "saas-engine",
    TIME_SOURCE: z.enum(["system"]).default("system"),
  });
});

// --------------------------------------------------
// Webhooks (RAW BODY ONLY)
// --------------------------------------------------

app.use("/api/webhooks", stripeWebhookRouter);

// --------------------------------------------------
// JSON body parsing (AFTER webhooks)
// --------------------------------------------------

app.use(express.json({ limit: "1mb" }));

// --------------------------------------------------
// Auth
// --------------------------------------------------
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/logout
app.use("/api/auth", authRouter);

// --------------------------------------------------
// Core API surfaces
// --------------------------------------------------

app.use("/api/billing", billingRouter);
app.use("/api/modules", modulesRouter);

// Plan truth — state emission only (no enforcement)
app.use("/api/plan", planTruthRouter);

// --------------------------------------------------
// 404 (last)
// --------------------------------------------------

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND" });
});

export default app;

























