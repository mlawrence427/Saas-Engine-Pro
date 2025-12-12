// backend/src/routes/auth.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import { signAccessToken } from '../utils/jwt';
import { loginSchema, registerSchema } from '../utils/validation';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { authenticationError, badRequestError } from '../utils/errors';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequestError('Invalid request body', parsed.error.flatten());
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw badRequestError('User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      role: 'FOUNDER',
      plan: 'ENTERPRISE',
    },
  });

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  const token = signAccessToken(payload);
  const isProd = process.env.NODE_ENV === 'production';

  res
    .cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      data: {
        user: payload,
        token,
      },
    });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequestError('Invalid request body', parsed.error.flatten());
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw authenticationError('Invalid credentials');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw authenticationError('Invalid credentials');
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  const token = signAccessToken(payload);
  const isProd = process.env.NODE_ENV === 'production';

  res
    .cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      data: {
        user: payload,
        token,
      },
    });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';

  res
    .clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
    })
    .json({
      success: true,
      data: null,
    });
});

// GET /api/auth/me
router.get(
  '/me',
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw authenticationError('Unauthenticated');
    }

    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  }
);

export default router;
