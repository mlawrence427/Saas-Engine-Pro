// src/utils/AppError.ts

import { ZodError } from 'zod';
import { ErrorCode, ErrorStatusMap, type ErrorCodeType } from './errorCodes';

// ==========================================================
// AppError – normalized error type for all API responses
// ==========================================================

export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: ErrorCodeType,
    message: string,
    details?: Record<string, unknown>,
    isOperational = true,
  ) {
    super(message);

    this.code = code;
    this.statusCode = ErrorStatusMap[code] ?? 500;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        timestamp: this.timestamp,
      },
    };
  }

  // ========================================================
  // Static factories
  // ========================================================

  static validation(message = 'Validation error', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, details);
  }

  static fromZodError(err: ZodError) {
    return new AppError(ErrorCode.VALIDATION_ERROR, 'Validation failed', {
      issues: err.issues,
    });
  }

  static invalidInput(message = 'Invalid input', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.INVALID_INPUT, message, details);
  }

  static missingField(field: string, message?: string) {
    return new AppError(
      ErrorCode.MISSING_FIELD,
      message ?? `Missing required field: ${field}`,
      { field },
    );
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(ErrorCode.UNAUTHORIZED, message);
  }

  static invalidCredentials(message = 'Invalid credentials') {
    return new AppError(ErrorCode.INVALID_CREDENTIALS, message);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(ErrorCode.FORBIDDEN, message);
  }

  static notFound(message = 'Not found', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.NOT_FOUND, message, details);
  }

  static userNotFound(message = 'User not found', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.USER_NOT_FOUND, message, details);
  }

  static moduleNotFound(message = 'Module not found', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.MODULE_NOT_FOUND, message, details);
  }

  static conflict(message = 'Conflict', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.CONFLICT, message, details);
  }

  static insufficientRole(required: string) {
    return new AppError(ErrorCode.INSUFFICIENT_ROLE, `Requires ${required} role`, {
      required,
    });
  }

  static insufficientPlan(required: string) {
    return new AppError(
      ErrorCode.INSUFFICIENT_PLAN,
      `Requires ${required} plan or higher`,
      { required },
    );
  }

  static internal(message = 'Internal server error', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, details);
  }

  static database(message = 'Database error', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.DATABASE_ERROR, message, details);
  }

  static stripe(message = 'Stripe error', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.STRIPE_ERROR, message, details);
  }

  static stripeNotConfigured(message = 'Stripe not configured') {
    return new AppError(ErrorCode.STRIPE_NOT_CONFIGURED, message);
  }

  static stripeWebhook(message = 'Stripe webhook error', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.STRIPE_WEBHOOK_ERROR, message, details);
  }

  static stripeCustomer(message = 'Stripe customer error', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.STRIPE_CUSTOMER_ERROR, message, details);
  }

  static sessionExpired(message = 'Session expired') {
    return new AppError(ErrorCode.SESSION_EXPIRED, message);
  }

  static unavailable(message = 'Service unavailable', details?: Record<string, unknown>) {
    return new AppError(ErrorCode.SERVICE_UNAVAILABLE, message, details, false);
  }
}
