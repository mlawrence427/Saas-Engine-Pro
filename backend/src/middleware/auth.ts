import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthUser } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET missing in environment variables');
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization || '';

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & Partial<AuthUser>;

    if (!decoded.userId || !decoded.email || !decoded.role) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role as AuthUser['role'],
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
