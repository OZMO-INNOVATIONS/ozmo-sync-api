/**
 * @file jwt.js
 * @description Reusable JWT utility — sign and verify access & refresh tokens.
 *              All token operations are centralised here so algorithm/secret
 *              changes only ever touch one file.
 */

'use strict';

const jwt    = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Sign a short-lived access token.
 * @param {{ id: string, email: string, role: string }} payload
 * @returns {string} signed JWT
 */
function signAccessToken(payload) {
  return jwt.sign(
    { sub: payload.id, email: payload.email, role: payload.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN, algorithm: 'HS256' },
  );
}

/**
 * Sign a long-lived refresh token containing only the user id.
 * @param {string} userId
 * @returns {string} signed refresh JWT
 */
function signRefreshToken(userId) {
  return jwt.sign(
    { sub: userId },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES, algorithm: 'HS256' },
  );
}

/**
 * Verify an access token and return its decoded payload.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

/**
 * Verify a refresh token and return its decoded payload.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
