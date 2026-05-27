/**
 * @file env.js
 * @description Centralized environment configuration.
 *              Loads .env via dotenv and exports typed config values.
 *              Throws on missing required variables so the app fails fast.
 */

'use strict';

const dotenv = require('dotenv');
const path   = require('path');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Assert that a required env variable is present.
 * @param {string} key
 * @returns {string}
 */
function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Read an optional env variable with a default fallback.
 * @param {string} key
 * @param {string} defaultValue
 * @returns {string}
 */
function optional(key, defaultValue) {
  return process.env[key] || defaultValue;
}

const config = {
  // ── App ──────────────────────────────────────────────────────────────────────
  NODE_ENV : optional('NODE_ENV', 'development'),
  PORT     : parseInt(optional('PORT', '3000'), 10),
  APP_NAME : optional('APP_NAME', 'ozmo-auth-api'),

  // ── JWT ───────────────────────────────────────────────────────────────────────
  JWT_SECRET          : required('JWT_SECRET'),
  JWT_EXPIRES_IN      : optional('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_SECRET  : required('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES : optional('JWT_REFRESH_EXPIRES', '7d'),

  // ── Security ─────────────────────────────────────────────────────────────────
  BCRYPT_SALT_ROUNDS : parseInt(optional('BCRYPT_SALT_ROUNDS', '12'), 10),

  // ── CORS ─────────────────────────────────────────────────────────────────────
  ALLOWED_ORIGINS : optional('ALLOWED_ORIGINS', 'http://localhost:3000'),

  // ── Rate Limiting ─────────────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS : parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10), // 15 min
  RATE_LIMIT_MAX       : parseInt(optional('RATE_LIMIT_MAX', '100'), 10),
};

module.exports = config;
