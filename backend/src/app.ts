// backend/src/app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Routers
import authRouter from "./routes/auth.routes";          // ← adjust name/path if needed
import adminModulesRouter from "./routes/admin.modules";
import adminAIModulesRouter from "./routes/admin.ai-modules";

const app = express();

const allowedOrigins =
  process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) || [
    "http://localhost:3000",
  ];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Auth routes (login, register, me, etc.)
app.use("/api/auth", authRouter);

// Admin module registry API
app.use("/api/admin/modules", adminModulesRouter);

// AI module drafts API
app.use("/api/admin/ai-modules", adminAIModulesRouter);

export default app;











