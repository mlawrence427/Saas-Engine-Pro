// src/utils/types.ts

import type { Request } from 'express';
import type { AuthUser } from '../types';

// Express request with an authenticated user attached
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// Generic API response shape (optional helper)
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp?: string;
  };
}
