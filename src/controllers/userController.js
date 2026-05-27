/**
 * @file userController.js
 * @description Thin controller for user-centric endpoints.
 *              All protected routes — `authenticate` is applied at the router level.
 */

'use strict';

const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/v1/user/profile
 * Returns the profile of the currently authenticated user.
 */
async function getProfile(req, res, next) {
  try {
    // req.user is populated by the authenticate middleware
    const profile = authService.getProfile(req.user.id);
    return sendSuccess(res, { user: profile }, 'Profile fetched successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = { getProfile };
