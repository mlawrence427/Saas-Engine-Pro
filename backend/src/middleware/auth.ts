// backend/src/middleware/auth.ts
// Read JWT from cookie, verify, and attach user payload to req.user

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET missing or too short");
  }
  return secret;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let token: string | undefined;

    // 1️⃣ Cookie auth (primary)
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // 2️⃣ Bearer auth (fallback)
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const payload = jwt.verify(token, getJwtSecret()) as {
      userId: string;
    };

    // 👇 THIS must match login payload
    (req as any).userId = payload.userId;

    next();
  } catch (err) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
}


