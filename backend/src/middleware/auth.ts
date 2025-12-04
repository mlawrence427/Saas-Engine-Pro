import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("❌ JWT_SECRET missing in environment variables");
    return res.status(500).json({ message: "Server misconfiguration: missing JWT_SECRET" });
  }

  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
