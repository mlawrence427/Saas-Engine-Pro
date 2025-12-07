// backend/src/app.ts

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth.routes";
import billingRoutes from "./routes/billing.routes";
import moduleRoutes from "./routes/module.routes";
import moduleAIRoutes from "./routes/module.ai.routes";
import moduleRegistryRoutes from "./routes/module.registry.routes";
import { stripeWebhookHandler, stripeRawBody } from "./routes/stripe.webhooks";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(cookieParser());

  app.post(
    "/api/webhooks/stripe",
    stripeRawBody,
    stripeWebhookHandler
  );

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/billing", billingRoutes);
  app.use("/api/modules", moduleRoutes);
  app.use("/api/modules/ai", moduleAIRoutes);
  app.use("/api/modules/registry", moduleRegistryRoutes); // ✅ admin registry

  return app;
}








