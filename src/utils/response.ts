import { Response } from 'express';

/**
 * Standard API response shape.
 * All responses follow this structure for consistency.
 */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

/**
 * Send a success response with consistent formatting.
 * @param res - Express response object
 * @param data - Response payload (excluded for error responses)
 * @param message - Human-readable message
 * @param statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = <T = unknown>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): void => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  } satisfies ApiResponse<T>);
};

/**
 * Send an error response with consistent formatting.
 * @param res - Express response object
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code (default: 500)
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500
): void => {
  res.status(statusCode).json({
    status: 'error',
    message,
  } satisfies ApiResponse);
};
