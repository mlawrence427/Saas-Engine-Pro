// src/routes/admin/users.ts
// Stubbed for compilation - not implemented in this phase

import { Router, RequestHandler } from 'express';

const router = Router();

const notImplemented: RequestHandler = (_req, res) => {
  res.status(501).json({ message: 'Not implemented in this phase' });
};

router.get('/', notImplemented);
router.get('/:id', notImplemented);
router.put('/:id', notImplemented);
router.delete('/:id', notImplemented);
router.post('/:id/impersonate', notImplemented);

export default router;