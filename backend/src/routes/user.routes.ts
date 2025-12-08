// src/routes/user.routes.ts
import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth.middleware';
import type { AuthUser } from '../types';

interface AuthRequest extends Request {
  user?: AuthUser;
}

const router = Router();

// GET /api/user/me (or whatever path you mount this on)
router.get(
  '/me',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        // no `name` here – not in the Prisma model
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  }
);

export default router;



