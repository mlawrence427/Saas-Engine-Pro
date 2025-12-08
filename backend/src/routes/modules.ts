// src/routes/modules.ts
import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

/**
 * GET /modules
 * Returns all enabled modules.
 */
router.get('/', async (_req: Request, res: Response) => {
  const modules = await prisma.module.findMany({
    where: { enabled: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(modules);
});

/**
 * GET /modules/:id
 * Fetch a single enabled module by ID.
 * (If you prefer key-based lookup, change `id` -> `key` below.)
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const mod = await prisma.module.findUnique({
    where: { id },
  });

  if (!mod || !mod.enabled) {
    return res.status(404).json({ error: 'Module not found' });
  }

  return res.json(mod);
});

export default router;

