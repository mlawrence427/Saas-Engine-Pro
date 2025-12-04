import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized — missing token",
    });
  }

  const token = header.replace("Bearer ", "");

  const decoded = verifyJwt<{ id: string; email: string }>(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized — invalid or expired token",
    });
  }

  // Attach user to req so downstream routes can access it
  req.user = {
    id: decoded.id,
    email: decoded.email,
  };

  next();
}
