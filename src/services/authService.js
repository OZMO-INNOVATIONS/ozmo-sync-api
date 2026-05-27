/**
 * @file authService.js
 * @description Business logic layer for authentication.
 *              Orchestrates the repository, JWT utility, and password utility.
 *              Controllers call this; this layer never touches req/res.
 */

'use strict';

const userRepo        = require('../repositories/userRepository');
const { comparePassword, hashPassword } = require('../utils/password');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Strip sensitive fields before returning a user object to the client.
 * @param {object} user
 * @returns {object} safe user profile
 */
function _sanitize(user) {
  const { password, refreshToken, ...profile } = user; // eslint-disable-line no-unused-vars
  return profile;
}

// ── Auth operations ───────────────────────────────────────────────────────────

/**
 * Validate credentials and return tokens + profile on success.
 *
 * @param {string} email
 * @param {string} plainPassword
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 * @throws {Error} with .statusCode set for the error middleware
 */
async function login(email, plainPassword) {
  // 1. Look up user
  const user = userRepo.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // 2. Verify password
  const isMatch = await comparePassword(plainPassword, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // 3. Issue tokens
  const accessToken  = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken(user.id);

  // 4. Persist hashed refresh token (store raw token — hash it for extra security)
  const hashedRefresh = await hashPassword(refreshToken);
  userRepo.saveRefreshToken(user.id, hashedRefresh);

  return { accessToken, refreshToken, user: _sanitize(user) };
}

/**
 * Rotate tokens using a valid refresh token.
 *
 * @param {string} token  - the raw refresh token from the client
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 * @throws {Error}
 */
async function refreshTokens(token) {
  // 1. Verify signature & expiry
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  // 2. Locate user
  const user = userRepo.findById(payload.sub);
  if (!user || !user.refreshToken) {
    const err = new Error('Refresh token not recognised — please log in again');
    err.statusCode = 401;
    throw err;
  }

  // 3. Compare supplied token against stored hash
  const isMatch = await comparePassword(token, user.refreshToken);
  if (!isMatch) {
    const err = new Error('Refresh token mismatch — possible token reuse detected');
    err.statusCode = 401;
    throw err;
  }

  // 4. Issue new token pair (rotation)
  const newAccess  = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const newRefresh = signRefreshToken(user.id);
  const hashedNew  = await hashPassword(newRefresh);
  userRepo.saveRefreshToken(user.id, hashedNew);

  return { accessToken: newAccess, refreshToken: newRefresh, user: _sanitize(user) };
}

/**
 * Invalidate the stored refresh token (logout).
 * @param {string} userId
 * @returns {void}
 */
async function logout(userId) {
  userRepo.saveRefreshToken(userId, null);
}

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} dto
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 */
async function register(dto) {
  // 1. Duplicate email check
  const existing = userRepo.findByEmail(dto.email);
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  // 2. Hash password before storage
  const hashed = await hashPassword(dto.password);

  // 3. Persist
  const newUser = userRepo.create({ ...dto, password: hashed });

  // 4. Issue initial tokens
  const accessToken  = signAccessToken({ id: newUser.id, email: newUser.email, role: newUser.role });
  const refreshToken = signRefreshToken(newUser.id);
  const hashedRefresh = await hashPassword(refreshToken);
  userRepo.saveRefreshToken(newUser.id, hashedRefresh);

  return { accessToken, refreshToken, user: _sanitize(newUser) };
}

/**
 * Fetch and sanitize the profile of a single user.
 * @param {string} userId
 * @returns {object}
 */
function getProfile(userId) {
  const user = userRepo.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return _sanitize(user);
}

module.exports = { login, refreshTokens, logout, register, getProfile };
