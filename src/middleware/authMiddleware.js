/**
 * @file authMiddleware.js
 * @description JWT authentication guard + role-based access control (RBAC).
 *
 *  Usage:
 *    router.get('/profile', authenticate, handler);
 *    router.delete('/admin/user/:id', authenticate, authorize('admin'), handler);
 */

'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const { sendUnauthorized, sendForbidden } = require('../utils/response');

/**
 * `authenticate` — verify Bearer token and attach decoded payload to req.user.
 *
 * @type {import('express').RequestHandler}
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'No token provided — Bearer <token> required');
    }

    const token   = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Attach a clean user object — never the raw JWT payload
    req.user = {
      id    : decoded.sub,
      email : decoded.email,
      role  : decoded.role,
    };

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Access token expired — please refresh');
    }
    return sendUnauthorized(res, 'Invalid access token');
  }
}

/**
 * `authorize(...roles)` — role-based guard, must come after `authenticate`.
 *
 * @param {...string} roles  - allowed roles, e.g. authorize('admin', 'moderator')
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Not authenticated');
    }
    if (!roles.includes(req.user.role)) {
      return sendForbidden(res, `Role '${req.user.role}' is not permitted to access this resource`);
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
