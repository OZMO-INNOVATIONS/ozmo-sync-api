/**
 * @file validationMiddleware.js
 * @description express-validator rule-sets for each endpoint.
 *
 *  Pattern:
 *    1. Export an array of check() rules per route.
 *    2. Follow it with the `validate` middleware that reads validationResult
 *       and calls next(err) if there are failures — reaches globalErrorHandler.
 *
 *  Usage in a router:
 *    router.post('/login', loginRules, validate, authController.login);
 */

'use strict';

const { body, validationResult } = require('express-validator');

// ── Reusable field validators ─────────────────────────────────────────────────

const emailField = (field = 'email') =>
  body(field)
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail();

const passwordField = (field = 'password', minLen = 8) =>
  body(field)
    .notEmpty().withMessage('Password is required')
    .isLength({ min: minLen }).withMessage(`Password must be at least ${minLen} characters`)
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number');

const nameField = (field = 'name') =>
  body(field)
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters');

// ── Rule sets ─────────────────────────────────────────────────────────────────

/** POST /api/auth/login */
const loginRules = [
  emailField(),
  body('password').notEmpty().withMessage('Password is required'),
];

/** POST /api/auth/register */
const registerRules = [
  nameField(),
  emailField(),
  passwordField(),
];

/** POST /api/auth/refresh */
const refreshRules = [
  body('refreshToken')
    .notEmpty().withMessage('refreshToken is required')
    .isString().withMessage('refreshToken must be a string'),
];

// ── Validation result collector ───────────────────────────────────────────────

/**
 * Read express-validator's result and forward errors to the global error handler.
 * Mount AFTER the rule-set array in the middleware chain.
 *
 * @type {import('express').RequestHandler}
 */
function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const err = new Error('Validation failed');
    err.type   = 'validation';
    err.errors = result.array().map((e) => ({
      field   : e.path,
      message : e.msg,
    }));
    return next(err);
  }
  return next();
}

module.exports = {
  loginRules,
  registerRules,
  refreshRules,
  validate,
};
