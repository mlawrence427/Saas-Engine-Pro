// src/types/index.ts - Core type definitions

import { Role, PlanTier } from '@prisma/client';

/**
 * ✅ AuthUser - The user object attached to authenticated requests
 * 
 * IMPORTANT: These values come from the DATABASE, not the JWT token.
 * This ensures role/plan changes take effect immediately.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  plan: PlanTier;
}

/**
 * JWT payload structure (for reference)
 * Note: role/plan in token may be stale - always use DB values
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  plan: PlanTier;
  iat: number;
  exp: number;
}

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Standard API success response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}
