import jwt, {
  SignOptions,
  VerifyOptions,
  JwtPayload as JwtPayloadBase,
  Secret,
} from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayloadInput = Record<string, unknown>;
export type JwtPayload = JwtPayloadBase | string;

const baseOptions: SignOptions = {
  algorithm: 'HS256',
};

const JWT_SECRET: Secret = env.JWT_SECRET;

export function signAccessToken(payload: JwtPayloadInput): string {
  // Use 'as any' to bypass the overload mismatch for expiresIn with env variables
  return (jwt as any).sign(payload, JWT_SECRET, {
    ...baseOptions,
    expiresIn: env.JWT_EXPIRES_IN,
  }) as string;
}

export function signRefreshToken(payload: JwtPayloadInput): string {
  // Use 'as any' here as well
  return (jwt as any).sign(payload, JWT_SECRET, {
    ...baseOptions,
    expiresIn: env.JWT_EXPIRES_IN,
  }) as string;
}

export function verifyToken<T = JwtPayload>(
  token: string,
  options: VerifyOptions = {}
): T {
  return jwt.verify(token, JWT_SECRET, options) as T;
}




