import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      errorResponse(err.message, err.code, 
        'details' in err ? (err as any).details : undefined
      )
    );
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.reduce((acc, e) => {
      const path = e.path.join('.');
      acc[path] = e.message;
      return acc;
    }, {} as Record<string, string>);

    res.status(422).json(
      errorResponse('Validation failed', 'VALIDATION_ERROR', details)
    );
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    if (prismaError.code === 'P2002') {
      res.status(409).json(
        errorResponse('Resource already exists', 'CONFLICT')
      );
      return;
    }
    
    if (prismaError.code === 'P2025') {
      res.status(404).json(
        errorResponse('Resource not found', 'NOT_FOUND')
      );
      return;
    }
  }

  // Handle unknown errors
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(500).json(
    errorResponse(message, 'INTERNAL_ERROR')
  );
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json(
    errorResponse(`Route ${req.method} ${req.path} not found`, 'NOT_FOUND')
  );
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
