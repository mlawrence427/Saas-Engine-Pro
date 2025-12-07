// backend/src/middleware/requireAuth.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

interface JwtPayload {
  userId: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  name?: string | null;
  plan?: string | null;
  subscriptionStatus?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization || "";
    const headerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const anyReq = req as any;
    const cookieToken: string | undefined = anyReq.cookies?.token;

    const token = headerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("[requireAuth] JWT_SECRET is not set");
      return res
        .status(500)
        .json({ error: "Auth not configured on the server" });
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded?.userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email ?? undefined,
      name: dbUser.name,
      plan: dbUser.plan,
      subscriptionStatus: dbUser.subscriptionStatus,
    };

    return next();
  } catch (err) {
    console.error("[requireAuth] error", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default requireAuth;

