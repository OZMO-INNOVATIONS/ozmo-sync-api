import { SetMetadata } from '@nestjs/common';

/**
 * Role type used throughout the application.
 */
export type UserRole = 'user' | 'admin' | 'superadmin';

/**
 * Metadata key used by the RolesGuard to retrieve allowed roles.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator that marks a route handler (or an entire controller) with the
 * roles permitted to access it.
 *
 * Usage:
 *   @Roles('admin', 'superadmin')
 *   @Get('users')
 *   getAllUsers() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
