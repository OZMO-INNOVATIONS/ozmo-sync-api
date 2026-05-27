/**
 * @file userRepository.js
 * @description Repository layer — the ONLY place that reads/writes users.json.
 *              All other layers (services, controllers) stay completely ignorant
 *              of how/where users are stored.  Swap the file for a real DB by
 *              changing only this file.
 *
 *  Persistence strategy:
 *    - On startup the JSON file is read into an in-memory array.
 *    - Every mutating operation flushes the array back to disk atomically
 *      via a write-then-rename pattern (avoids partial writes).
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/** Absolute path to the JSON data file. */
const DATA_FILE = path.resolve(__dirname, '../data/users.json');

// ── In-memory cache ───────────────────────────────────────────────────────────

/**
 * Load users from disk into memory.
 * @returns {object[]}
 */
function _load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    // If the file doesn't exist yet, start with an empty array.
    return [];
  }
}

/**
 * Persist the in-memory array back to disk.
 * Uses a temp file + rename for atomicity.
 * @param {object[]} users
 */
function _save(users) {
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

// Warm the cache once at module load time.
let _users = _load();

// ── Read helpers ──────────────────────────────────────────────────────────────

/**
 * Return every user (full objects including hashed password).
 * @returns {object[]}
 */
function findAll() {
  return [..._users];
}

/**
 * Find a single user by their unique id.
 * @param {string} id
 * @returns {object|null}
 */
function findById(id) {
  return _users.find((u) => u.id === id) || null;
}

/**
 * Find a single user by email address (case-insensitive).
 * @param {string} email
 * @returns {object|null}
 */
function findByEmail(email) {
  return _users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// ── Write helpers ─────────────────────────────────────────────────────────────

/**
 * Persist a brand-new user.
 * @param {{ name: string, email: string, password: string, role?: string }} dto
 * @returns {object} the created user (including generated id)
 */
function create(dto) {
  const newUser = {
    id           : uuidv4(),
    name         : dto.name,
    email        : dto.email.toLowerCase(),
    password     : dto.password, // must already be hashed
    role         : dto.role || 'user',
    createdAt    : new Date().toISOString(),
    refreshToken : null,
  };

  _users.push(newUser);
  _save(_users);
  return newUser;
}

/**
 * Update arbitrary fields on an existing user.
 * @param {string} id
 * @param {object} updates  - plain object of fields to merge
 * @returns {object|null}   - updated user, or null if not found
 */
function updateById(id, updates) {
  const index = _users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  _users[index] = { ..._users[index], ...updates };
  _save(_users);
  return _users[index];
}

/**
 * Store (or clear) a hashed refresh token for a user.
 * @param {string} id
 * @param {string|null} token
 * @returns {object|null}
 */
function saveRefreshToken(id, token) {
  return updateById(id, { refreshToken: token });
}

/**
 * Remove a user permanently.
 * @param {string} id
 * @returns {boolean} true if a user was deleted
 */
function deleteById(id) {
  const before = _users.length;
  _users = _users.filter((u) => u.id !== id);
  if (_users.length !== before) {
    _save(_users);
    return true;
  }
  return false;
}

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
  updateById,
  saveRefreshToken,
  deleteById,
};
