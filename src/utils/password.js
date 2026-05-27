/**
 * @file password.js
 * @description Reusable password hashing utility powered by bcryptjs.
 *              bcryptjs is a pure-JS port — no native bindings required.
 */

'use strict';

const bcrypt = require('bcryptjs');
const config = require('../config/env');

/**
 * Hash a plain-text password.
 * @param {string} plainText
 * @returns {Promise<string>} bcrypt hash
 */
async function hashPassword(plainText) {
  return bcrypt.hash(plainText, config.BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 * @param {string} plainText
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

module.exports = { hashPassword, comparePassword };
