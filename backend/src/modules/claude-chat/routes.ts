// src/modules/claude-chat/routes.ts
// Stubbed for compilation - not implemented in this phase

import { Router, RequestHandler } from 'express';

const router = Router();

const notImplemented: RequestHandler = (_req, res) => {
  res.status(501).json({ message: 'Not implemented in this phase' });
};

router.post('/chat', notImplemented);
router.get('/history', notImplemented);
router.delete('/history/:id', notImplemented);

export default router;

