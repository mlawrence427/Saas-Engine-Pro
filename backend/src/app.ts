// src/app.ts

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

// ✅ You MUST import the route files
import authRoutes from "./api/auth/auth.routes";
import userRoutes from "./api/user/routes";

export function createApp() {
  const app = express();

  // ======== Middlewares ========
  app.use(cors());
  app.use(express.json());

  // ======== Health Check ========
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ======== Auth routes ========
  app.use("/api/auth", authRoutes);

  // ======== Protected user routes ========
  app.use("/api/user", userRoutes);

  return app;
}
