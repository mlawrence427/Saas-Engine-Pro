import { Request } from 'express';
import { JwtPayload } from './auth';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: boolean;
  code?: string;
  details?: object;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    error: false,
    data,
    message,
  };
}

export function errorResponse(message: string, code?: string, details?: object): ApiResponse {
  return {
    success: false,
    error: true,
    message,
    code,
    details,
  };
}
