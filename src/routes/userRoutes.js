/**
 * @file userRoutes.js
 * @description User router — all routes mounted under /api/v1/user
 *              Every route here is protected by the authenticate middleware.
 *
 *  Protected routes:
 *    GET  /api/v1/user/profile          → any authenticated user
 */

'use strict';

const { Router } = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = Router();

// Apply authenticate to the entire user router
router.use(authenticate);

// ── Routes ────────────────────────────────────────────────────────────────────

/** Fetch the logged-in user's profile */
router.get('/profile', userController.getProfile);

/**
 * Admin-only example — demonstrates role-based guard.
 * GET /api/v1/user/admin/dashboard
 * Uncomment when you add an admin controller.
 */
// router.get('/admin/dashboard', authorize('admin'), adminController.dashboard);

module.exports = router;
