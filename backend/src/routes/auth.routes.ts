import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { PlanTier, Role } from "@prisma/client";
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { hashPassword, comparePassword, signToken } from '../utils/auth';

const router = Router();

// Alias for compatibility if needed elsewhere, though using Role directly is better
type UserRole = Role;

function sendAuthResponse(res: Response, user: any) {
  const token = signToken({ userId: user.id });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
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
 * POST /api/register
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashed, // Fixed: use passwordHash
        plan: PlanTier.FREE,
        role: Role.USER,      // Fixed: use Role
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
    console.error("Error in POST /api/register:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
});

/**
 * POST /api/login
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check against passwordHash
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      plan: user.plan,
      role: user.role,
    };

    return sendAuthResponse(res, safeUser);
  } catch (err) {
    console.error("Error in POST /api/login:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get(
  "/me",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.json(req.user);
  }
);

export default router;






