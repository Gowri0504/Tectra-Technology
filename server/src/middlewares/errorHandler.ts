import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response';

export class AppError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err instanceof ZodError) {
    return sendError(res, 'Validation failed', 400, err.issues);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return sendError(res, 'Duplicate record found', 400);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Record not found', 404);
    }
    if (err.code === 'P2003') {
      return sendError(res, 'Foreign key constraint failed', 400);
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return sendError(res, 'Invalid data provided to database', 400);
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return sendError(res, 'Database connection failed', 503);
  }

  logger.error(err);

  const isProduction = process.env.NODE_ENV === 'production';

  return sendError(
    res,
    isProduction ? 'Internal server error' : message,
    statusCode,
    isProduction ? undefined : { stack: err.stack, details: err }
  );
};
