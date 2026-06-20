import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = 'statusCode' in err ? (err as AppError).statusCode : 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error({ message: err.message, stack: err.stack, url: req.url, method: req.method });
  }

  // Prisma known errors
  const errAsAny = err as Record<string, unknown>;
  if (errAsAny['code'] !== undefined) {
    if (errAsAny['code'] === 'P2002') {
      const meta = errAsAny['meta'] as { target?: string[] } | undefined;
      res.status(409).json({
        success: false,
        error: `Duplicate entry: ${meta?.target?.join(', ')} already exists`,
      });
      return;
    }
    if (errAsAny['code'] === 'P2025') {
      res.status(404).json({ success: false, error: 'Resource not found' });
      return;
    }
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, error: 'Token expired' });
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
