// src/routes/auth.ts
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables");
}

interface JwtPayload {
  userId: string;
}

function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function buildAuthPayload(user: { id: string; name: string | null; email: string }) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

// -----------------------------
// REGISTER
// POST /api/auth/register
// -----------------------------
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
        },
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must be at least 8 characters",
        },
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        error: {
          code: "EMAIL_IN_USE",
          message: "Email already in use",
        },
      });
    }

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: name || "",
        email,
        password: hashed,
      },
    });

    const token = generateToken(user.id);

    return res.status(201).json({
      ...buildAuthPayload(user),
      token,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Registration failed",
      },
    });
  }
});

// -----------------------------
// LOGIN
// POST /api/auth/login
// -----------------------------
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid credentials",
        },
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid credentials",
        },
      });
    }

    const token = generateToken(user.id);

    return res.json({
      ...buildAuthPayload(user),
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Login failed",
      },
    });
  }
});

// -----------------------------
// ME (session check)
// GET /api/auth/me
// -----------------------------
router.get("/me", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid authorization header",
        },
      });
    }

    const token = auth.replace("Bearer ", "").trim();

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid token",
        },
      });
    }

    return res.json(buildAuthPayload(user));
  } catch (err: any) {
    console.error("ME CHECK ERROR:", err);

    const isJwtError =
      err.name === "TokenExpiredError" || err.name === "JsonWebTokenError";

    return res.status(401).json({
      error: {
        code: isJwtError ? "INVALID_TOKEN" : "UNAUTHORIZED",
        message: "Invalid or expired token",
      },
    });
  }
});

export default router;

