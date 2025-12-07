// backend/src/middleware/requireAdmin.ts

import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";

interface AdminRequest extends Request {
  user?: {
    role?: UserRole;
    [key: string]: any;
  };
}

export default function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  const user = req.user;

  if (!user || user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: "Admin access required" });
  }

  return next();
}

