// backend/src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";

// Stripe webhook MUST be mounted before express.json()
import stripeWebhookRouter from "./routes/stripe.webhooks";

// ✅ Your real auth router lives here:
import authRouter from "./api/auth/auth.routes";

// Keep these if they exist in your repo:
import billingRouter from "./routes/billing.routes";
import modulesRouter from "./routes/module.registry.routes";

const app = express();

app.use(morgan("dev"));

// ✅ Needed because requireAuth reads req.cookies.token
app.use(cookieParser());

app.use(
  cors({
    origin: env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "saas-engine",
    time_source: (env as any).TIME_SOURCE ?? "system",
  });
});

// ✅ Webhooks first (raw body)
app.use("/api/webhooks", stripeWebhookRouter);

// ✅ Everything else JSON
app.use(express.json({ limit: "1mb" }));

// ✅ Auth endpoints:
// POST /api/auth/register
// POST /api/auth/login
app.use("/api/auth", authRouter);

// ✅ Other API areas
app.use("/api/billing", billingRouter);
app.use("/api/modules", modulesRouter);

app.use((_req, res) => res.status(404).json({ error: "NOT_FOUND" }));

export default app;
























