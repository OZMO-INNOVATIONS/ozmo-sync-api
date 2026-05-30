import { Router } from 'express';
import { getAllUsers, blockUser, unblockUser, updateRole } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + admin or superadmin role
router.use(authenticate, authorize('admin', 'superadmin'));

/**
 * GET /api/v1/admin/users
 * List all users. Accessible by admin and superadmin.
 */
router.get('/users', getAllUsers);

/**
 * PATCH /api/v1/admin/users/:id/block
 * Block a user. Accessible by admin and superadmin.
 */
router.patch('/users/:id/block', blockUser);

/**
 * PATCH /api/v1/admin/users/:id/unblock
 * Unblock a user. Accessible by admin and superadmin.
 */
router.patch('/users/:id/unblock', unblockUser);

/**
 * PATCH /api/v1/admin/users/:id/role
 * Update a user's role. Only superadmin can assign superadmin.
 * Accessible by admin and superadmin.
 */
router.patch('/users/:id/role', updateRole);

export default router;
