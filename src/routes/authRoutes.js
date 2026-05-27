/**
 * @file authRoutes.js
 * @description Auth router — all routes mounted under /api/v1/auth
 *
 *  Public routes (no token required):
 *    POST /api/v1/auth/register
 *    POST /api/v1/auth/login
 *    POST /api/v1/auth/refresh
 *
 *  Protected routes (Bearer token required):
 *    POST /api/v1/auth/logout
 */

'use strict';

const { Router } = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  loginRules,
  registerRules,
  refreshRules,
  validate,
} = require('../middleware/validationMiddleware');

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────

/** Register a new user */
router.post('/register', registerRules, validate, authController.register);

/** Login and receive tokens */
router.post('/login', loginRules, validate, authController.login);

/** Exchange a refresh token for a new token pair */
router.post('/refresh', refreshRules, validate, authController.refresh);

// ── Protected ─────────────────────────────────────────────────────────────────

/** Logout — invalidates stored refresh token */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
