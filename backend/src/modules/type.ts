// src/modules/type.ts
import type { Request } from 'express';
import type { AuthUser } from '../types';

export type { AuthUser };

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}



