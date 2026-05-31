import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SafeUser } from '../users/interfaces/user.interface';
import { UserRole } from '../../common/decorators/roles.decorator';

/**
 * AdminService — thin wrapper around UsersService for admin-only operations.
 *
 * Keeping this layer separate follows the single-responsibility principle and
 * gives us a clean place to add admin-specific audit logging, notifications,
 * or business rules later.
 */
@Injectable()
export class AdminService {
  constructor(private readonly usersService: UsersService) {}

  /** List every user in the system (passwords excluded). */
  getAllUsers(): SafeUser[] {
    return this.usersService.getAllUsers();
  }

  /** Block a user account. */
  blockUser(id: number, requesterId?: number): SafeUser {
    return this.usersService.setBlockedStatus(id, true, requesterId);
  }

  /** Unblock a user account. */
  unblockUser(id: number, requesterId?: number): SafeUser {
    return this.usersService.setBlockedStatus(id, false, requesterId);
  }

  /** Change a user's role. */
  updateRole(
    id: number,
    role: UserRole,
    requesterRole?: UserRole,
    requesterId?: number,
  ): SafeUser {
    return this.usersService.updateRole(id, role, requesterRole, requesterId);
  }
}
