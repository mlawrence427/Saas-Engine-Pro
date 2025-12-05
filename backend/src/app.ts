// src/app.ts

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

// ===== IMPORT ROUTE FILES =====
import authRoutes from "./api/auth/auth.routes";
import userRoutes from "./api/user/routes";
import aiRoutes from "./routes/ai.routes";   // ✅ FIXED PATH

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

  // ===== AI ROUTES (Claude Backend) =====
  app.use("/api/ai", aiRoutes);   // This must be LAST

  return app;
}
