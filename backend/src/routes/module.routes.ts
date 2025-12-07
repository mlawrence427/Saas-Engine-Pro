// backend/src/routes/module.routes.ts

import { Router } from "express";
import requireAuth from "../middleware/requireAuth";
import { listModulesForUser } from "../modules/module.service";

const router = Router();

// GET /api/modules — list modules visible to current user
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const { id, plan, role } = req.user || {};

    if (!id || !plan || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const modules = await listModulesForUser({ id, plan, role });
    return res.json(modules);
  } catch (err) {
    console.error("Error in GET /api/modules:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;



