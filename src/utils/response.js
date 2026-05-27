/**
 * @file response.js
 * @description Reusable response helpers.
 *              Every API response follows the same envelope structure:
 *
 *  Success  →  { success: true,  data: {...},  message: "..." }
 *  Error    →  { success: false, error: "...", message: "..." }
 *
 *  This guarantees front-ends/consumers always parse the same shape.
 */

'use strict';

/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {object}  data        - payload to return
 * @param {string}  [message]   - human-readable success message
 * @param {number}  [statusCode=200]
 */
function sendSuccess(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success   : true,
    message,
    data,
    timestamp : new Date().toISOString(),
  });
}

/**
 * Send a created (201) response.
 * @param {import('express').Response} res
 * @param {object} data
 * @param {string} [message]
 */
function sendCreated(res, data = {}, message = 'Resource created') {
  return sendSuccess(res, data, message, 201);
}

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {string}  message
 * @param {number}  [statusCode=500]
 * @param {object}  [errors]    - optional field-level validation errors
 */
function sendError(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  const body = {
    success   : false,
    message,
    timestamp : new Date().toISOString(),
  };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

/**
 * Send a 401 Unauthorized response.
 * @param {import('express').Response} res
 * @param {string} [message]
 */
function sendUnauthorized(res, message = 'Unauthorized') {
  return sendError(res, message, 401);
}

/**
 * Send a 403 Forbidden response.
 * @param {import('express').Response} res
 * @param {string} [message]
 */
function sendForbidden(res, message = 'Forbidden — insufficient permissions') {
  return sendError(res, message, 403);
}

/**
 * Send a 404 Not Found response.
 * @param {import('express').Response} res
 * @param {string} [message]
 */
function sendNotFound(res, message = 'Resource not found') {
  return sendError(res, message, 404);
}

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
};
