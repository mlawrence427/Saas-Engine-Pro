// backend/src/app.ts
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth.routes";
import billingRoutes from "./routes/billing.routes";
import moduleRoutes from "./routes/module.routes";
import moduleAiRoutes from "./routes/module.ai.routes";
import { stripeWebhookHandler, stripeRawBody } from "./routes/stripe.webhooks";

const app = express();

// --- CORS (adjust origin if needed) ---
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// --- Cookies ---
app.use(cookieParser());

// --- Stripe webhook endpoint: MUST use raw body, BEFORE json() ---
app.post(
  "/api/webhooks/stripe",
  stripeRawBody,          // express.raw({ type: "application/json" })
  stripeWebhookHandler
);

// --- Normal JSON body parsing for everything else ---
app.use(express.json());

// --- Healthcheck ---
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// --- Main API routes ---
app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/modules/ai", moduleAiRoutes); // /api/modules/ai/generate

export default app;






