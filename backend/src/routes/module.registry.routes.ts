// src/routes/module.registry.routes.ts
// Simplified module registry - read-only public endpoint

import { Router, RequestHandler } from 'express';
import { prisma } from '../config/database';

const router = Router();

/**
 * GET /api/modules
 * Returns a simple list of non-archived modules
 */
const getModules: RequestHandler = async (_req, res, next) => {
  try {
    const modules = await prisma.module.findMany({
      where: { isArchived: false },
      orderBy: { slug: 'asc' },
    });
    res.json(modules);
  } catch (error) {
    next(error);
  }
};

router.get('/', getModules);

export default router;


