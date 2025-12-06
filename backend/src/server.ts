// backend/src/server.ts
import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { prisma } from "./utils/prisma";

const PORT = Number(process.env.PORT) || 3001;

async function startServer() {
  try {
    // Connect to the database
    await prisma.$connect();
    console.log("[INFO] Database connected successfully");

    const app = createApp();

    app.listen(PORT, "0.0.0.0", () => {
      const env = process.env.NODE_ENV || "development";

      console.log(`[INFO] 🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`[INFO] 📦 Environment: ${env}`);
      console.log(
        `[INFO] 📚 API docs: http://0.0.0.0:${PORT}/api/health`
      );
    });
  } catch (error) {
    console.error("[ERROR] Failed to start server", error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log("[INFO] Shutting down gracefully...");
  try {
    await prisma.$disconnect();
    console.log("[INFO] Database connection closed");
  } catch (err) {
    console.error("[ERROR] Error during shutdown", err);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();

