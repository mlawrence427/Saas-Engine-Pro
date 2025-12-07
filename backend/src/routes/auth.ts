// ============================================================
// src/routes/auth.ts - SaaS Engine Pro
// Authentication Routes (Login, Register, Logout)
// ============================================================

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prismaClient';
import { requireAuth } from "../middleware/auth";
import { AuditAction, AuditEntityType } from '@prisma/client';

const router = Router();

// ============================================================
// ENVIRONMENT
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ============================================================
// POST /api/auth/login
// ============================================================

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Email and password are required',
    });
    return;
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          plan: user.plan,
        },
        token, // Also return in body for non-cookie auth
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'LoginFailed',
      message: 'Login failed',
    });
  }
});

// ============================================================
// POST /api/auth/logout
// ============================================================

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// ============================================================
// GET /api/auth/me
// ============================================================

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'UserNotFound',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user },
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'FetchFailed',
      message: 'Failed to fetch user',
    });
  }
});

// ============================================================
// POST /api/auth/register (Optional - for self-service signup)
// ============================================================

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Email and password are required',
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Password must be at least 8 characters',
    });
    return;
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'EmailExists',
        message: 'An account with this email already exists',
      });
      return;
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'USER',
        plan: 'FREE',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: AuditAction.USER_CREATED,
        entityType: AuditEntityType.USER,
        entityId: user.id,
        performedByUserId: user.id,
        metadata: {
          email: user.email,
          source: 'self-registration',
        },
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          plan: user.plan,
        },
        token,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'RegistrationFailed',
      message: 'Registration failed',
    });
  }
});

export default router;
