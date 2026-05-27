/**
 * @file authController.js
 * @description Thin controller — delegates all business logic to authService.
 *              Only responsibility: parse req → call service → send response.
 */

'use strict';

const authService = require('../services/authService');
const {
  sendSuccess,
  sendCreated,
  sendError,
} = require('../utils/response');

/**
 * POST /api/v1/auth/register
 * Body: { name, email, password }
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    return sendCreated(res, result, 'Registration successful');
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return sendSuccess(res, result, 'Login successful');
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/auth/refresh
 * Body: { refreshToken }
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);
    return sendSuccess(res, result, 'Tokens refreshed');
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 * Protected — requires Bearer token (authenticate middleware applied in router).
 */
async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id);
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, refresh, logout };
