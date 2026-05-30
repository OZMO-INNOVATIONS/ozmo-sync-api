import { Request, Response, NextFunction } from 'express';
import { userStore, UserRole } from '../data/users';
import { sendSuccess, sendError } from '../utils/response';

const VALID_ROLES: UserRole[] = ['user', 'admin', 'superadmin'];

/**
 * GET /api/v1/admin/users
 * List all users. Restricted to admin and superadmin.
 */
export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = userStore.getAllUsers();
    sendSuccess(res, { users, total: users.length }, 'Users retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/users/:id/block
 * Block a user account.
 */
export const blockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      sendError(res, 'Invalid user ID', 400);
      return;
    }

    // Prevent blocking yourself
    if (req.user && req.user.userId === id) {
      sendError(res, 'You cannot block your own account', 400);
      return;
    }

    const updatedUser = userStore.setBlockedStatus(id, true);

    if (!updatedUser) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, updatedUser, 'User blocked successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/users/:id/unblock
 * Unblock a user account.
 */
export const unblockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      sendError(res, 'Invalid user ID', 400);
      return;
    }

    const updatedUser = userStore.setBlockedStatus(id, false);

    if (!updatedUser) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, updatedUser, 'User unblocked successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/users/:id/role
 * Update a user's role. Only superadmin can assign superadmin role.
 */
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (isNaN(id)) {
      sendError(res, 'Invalid user ID', 400);
      return;
    }

    if (!role || !VALID_ROLES.includes(role)) {
      sendError(res, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, 400);
      return;
    }

    // Only superadmin can assign the superadmin role
    if (role === 'superadmin' && req.user?.role !== 'superadmin') {
      sendError(res, 'Only superadmin can assign the superadmin role', 403);
      return;
    }

    // Prevent changing your own role
    if (req.user && req.user.userId === id) {
      sendError(res, 'You cannot change your own role', 400);
      return;
    }

    const updatedUser = userStore.updateRole(id, role);

    if (!updatedUser) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, updatedUser, 'User role updated successfully');
  } catch (err) {
    next(err);
  }
};
