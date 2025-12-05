// src/app.ts
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

// ===== IMPORT ROUTE FILES =====
import authRoutes from "./api/auth/auth.routes";
import userRoutes from "./api/user/routes";
import aiRoutes from "./api/ai.routes";   // 👈 ADD THIS LINE

export function createApp() {
  const app = express();

  // ===== MIDDLEWARE =====
  app.use(cors());
  app.use(express.json());

  // ===== HEALTH CHECK =====
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ===== AUTH ROUTES =====
  app.use("/api/auth", authRoutes);

  // ===== PROTECTED USER ROUTES =====
  app.use("/api/user", userRoutes);

  // ===== AI ROUTE (Claude Backend) =====
  app.use("/api/ai", aiRoutes);   // 👈 REQUIRED FOR Claude integration

  return app;
}
