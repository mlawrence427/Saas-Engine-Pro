import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev_secret_key";
const EXPIRES_IN = "7d";

export function signJwt(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyJwt<T>(token: string): T | null {
  try {
    return jwt.verify(token, SECRET) as T;
  } catch {
    return null;
  }
}
