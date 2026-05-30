import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Custom application error with HTTP status code.
 * Use this to throw expected errors (e.g., validation failures) that should
 * return a specific HTTP status code rather than a generic 500.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from programming bugs
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error-handling middleware.
 * Catches all errors thrown (via next(err)) and returns a consistent JSON response.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error in development for debugging
  if (config.nodeEnv === 'development') {
    console.error('[ERROR]', err);
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Handle unexpected / programming errors
  res.status(500).json({
    status: 'error',
    message: config.nodeEnv === 'production'
      ? 'Something went wrong'
      : err.message || 'Something went wrong',
  });
};
