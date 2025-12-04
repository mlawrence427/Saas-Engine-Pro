// src/routes/user.routes.ts

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/prisma';

export const userRouter = Router();

// GET /api/user/me
userRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error in /api/user/me', error);
    return res.status(500).json({ message: 'Failed to load current user' });
  }
});
