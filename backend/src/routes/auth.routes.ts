// backend/src/routes/auth.routes.ts

import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { PlanTier, UserRole } from "@prisma/client";
import requireAuth, {
  AuthenticatedRequest,
} from "../middleware/requireAuth";

const router = Router();

/**
 * Generate a signed JWT for a user id
 */
function generateToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

/**
 * Helper to send cookie + user payload
 */
function sendAuthResponse(res: Response, user: any) {
  const token = generateToken(user.id);

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true behind HTTPS / in production
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    id: user.id,
    email: user.email,
    plan: user.plan,
    role: user.role,
  });
}

/**
 * POST /api/auth/register
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        plan: PlanTier.FREE,
        role: UserRole.USER, // new users default to USER; you can promote to ADMIN manually
      },
      select: {
        id: true,
        email: true,
        plan: true,
        role: true,
      },
    });

    return sendAuthResponse(res, user);
  } catch (err) {
    console.error("Error in POST /api/auth/register:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Only expose safe fields to the client
    const safeUser = {
      id: user.id,
      email: user.email,
      plan: user.plan,
      role: user.role,
    };

    return sendAuthResponse(res, safeUser);
  } catch (err) {
    console.error("Error in POST /api/auth/login:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

/**
 * GET /api/auth/me
 * Used by the frontend AuthContext/AuthGuard to check the current user
 */
router.get(
  "/me",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json(req.user);
  }
);

export default router;






