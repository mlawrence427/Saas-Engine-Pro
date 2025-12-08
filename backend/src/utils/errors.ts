// src/utils/errors.ts

import type { ZodError } from 'zod';
import { AppError } from './AppError';
import { ErrorCode, ErrorCodeType } from './errorCodes';

export type ErrorDetails = Record<string, unknown> | undefined;

interface AppErrorOptions {
  code: ErrorCodeType;
  details?: ErrorDetails;
}

/**
 * Helper to construct a typed AppError.
 * AppError is assumed to be (code, message, details?)
 */
function makeError(message: string, options: AppErrorOptions): AppError {
  return new AppError(options.code, message, options.details);
}

/**
 * Convert a ZodError into an AppError with validation metadata.
 */
export function fromZodError(error: ZodError): AppError {
  const details: ErrorDetails = {
    issues: error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
      code: issue.code,
    })),
  };

  return makeError('Validation failed', {
    code: ErrorCode.VALIDATION_ERROR,
    details,
  });
}

/**
 * Authentication / authorization related error.
 */
export function authenticationError(
  message = 'Authentication failed',
  code: ErrorCodeType = ErrorCode.AUTHENTICATION_ERROR,
  details?: ErrorDetails
): AppError {
  return makeError(message, { code, details });
}

/**
 * Conflict (409) error – e.g. email already exists.
 */
export function conflictError(
  message = 'Resource conflict',
  details?: ErrorDetails
): AppError {
  return makeError(message, {
    code: ErrorCode.CONFLICT,
    details,
  });
}

/**
 * Not found (404) error.
 */
export function notFoundError(
  resourceName: string,
  id?: string | number
): AppError {
  const message = `${resourceName} not found`;
  const details: ErrorDetails = id ? { id } : undefined;

  return makeError(message, {
    code: ErrorCode.NOT_FOUND,
    details,
  });
}

// ---------------------------------------------------------------------------
// Compatibility error classes used in older services (Admin/Auth/etc.)
// ---------------------------------------------------------------------------

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: ErrorDetails) {
    super(ErrorCode.INVALID_INPUT, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: ErrorDetails) {
    super(ErrorCode.UNAUTHORIZED, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: ErrorDetails) {
    super(ErrorCode.CONFLICT, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found', details?: ErrorDetails) {
    super(ErrorCode.NOT_FOUND, message, details);
  }
}

// Re-export codes/types so existing imports keep working.
export { ErrorCode, ErrorCodeType };

