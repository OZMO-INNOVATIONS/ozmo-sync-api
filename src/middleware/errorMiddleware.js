/**
 * @file errorMiddleware.js
 * @description Centralised error handler — the LAST middleware in app.js.
 *
 *  Express identifies error-handling middleware by its four-argument signature:
 *  (err, req, res, next).  Any next(err) call in the app reaches here.
 *
 *  Error shape produced:
 *  {
 *    "success"   : false,
 *    "message"   : "Human-readable message",
 *    "timestamp" : "ISO string",
 *    "stack"     : "..."   ← only in development
 *  }
 */

'use strict';

const config = require('../config/env');

/**
 * 404 handler — mount BEFORE the error handler, AFTER all routes.
 * @type {import('express').RequestHandler}
 */
function notFoundHandler(req, res, _next) {
  res.status(404).json({
    success   : false,
    message   : `Route ${req.method} ${req.originalUrl} not found`,
    timestamp : new Date().toISOString(),
  });
}

/**
 * Global error handler.
 * Understands:
 *   - err.statusCode — set manually in services (e.g. 401, 404)
 *   - err.status     — set by some third-party libs (e.g. body-parser)
 *   - err.errors     — array from express-validator
 *   - JWT errors     — TokenExpiredError, JsonWebTokenError
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, next) {
  // Resolve HTTP status code
  let statusCode = err.statusCode || err.status || 500;

  // Handle express-validator's validationResult errors
  if (err.type === 'validation') {
    return res.status(422).json({
      success   : false,
      message   : 'Validation failed',
      errors    : err.errors,
      timestamp : new Date().toISOString(),
    });
  }

  // JWT specific errors → normalise to 401
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
  }

  // Payload too large
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    err.message = 'Request payload too large';
  }

  // Log to stderr (replace with a proper logger like Winston in production)
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${statusCode}`, err);
  }

  const body = {
    success   : false,
    message   : err.message || 'Something went wrong',
    timestamp : new Date().toISOString(),
  };

  // Expose stack traces only in development
  if (config.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  return res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, globalErrorHandler };
