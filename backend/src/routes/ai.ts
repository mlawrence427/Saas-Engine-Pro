import { Router } from "express";

const router = Router();

// Simple test route: GET /api/ai/ping
router.get("/ping", (_req, res) => {
  res.json({ ok: true });
});

export default router;
