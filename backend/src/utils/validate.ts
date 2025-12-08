// src/utils/validate.ts
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { fromZodError } from './errors';

/**
 * Wraps a Zod schema into an Express middleware.
 * On success: replaces req.body with the parsed data and calls next().
 * On failure: throws an AppError built from the ZodError.
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw fromZodError(result.error);
    }

    // Keep the parsed, typed data on the request
    (req as any).body = result.data;

    next();
  };
}

// Placeholder export to keep any existing `validation` imports happy.
export const validation = {};


