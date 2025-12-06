// backend/src/app.ts

import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import billingRoutes from "./routes/billing.routes";
import stripeRoutes from "./routes/stripe.routes";

import { authenticateJWT } from "./middleware/auth.middleware";
import { registerModules } from "./modules";

const app = express();

// --------------------
// Core Middleware
// --------------------
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// --------------------
// Public Routes
// --------------------
app.use("/api/auth", authRoutes);

// --------------------
// Protected Routes
// --------------------
app.use("/api/user", authenticateJWT, userRoutes);
app.use("/api/billing", authenticateJWT, billingRoutes);
app.use("/api/stripe", stripeRoutes); // Stripe webhooks usually must remain public

// --------------------
// ✅ MODULE SYSTEM (AUTO-REGISTER)
// --------------------
registerModules(app);

// --------------------
// Health Check
// --------------------
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// --------------------
// Global Error Handler
// --------------------
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("UNHANDLED ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

export default app;



