import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { env } from '../config/env';

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

export function signToken(payload: object): string {
  return (jwt as any).sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  }) as string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, userHash: string): Promise<boolean> => {
  return await bcrypt.compare(password, userHash);
};

// Backwards compatibility if passing the whole user object
export const validatePassword = async (password: string, user: User): Promise<boolean> => {
  if (!user.passwordHash) return false;
  return await bcrypt.compare(password, user.passwordHash);
};

export const generateToken = signToken;


