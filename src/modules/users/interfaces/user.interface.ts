import { UserRole } from '../../../common/decorators/roles.decorator';

/**
 * Core User entity.
 *
 * This shape matches what a Prisma model would produce in the future.
 * Migration path: replace this interface with the Prisma-generated type.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  password: string; // bcrypt-hashed
  role: UserRole;
  isBlocked: boolean;
  createdAt: Date;
}

/**
 * Public view of a User — omits sensitive fields (password, isBlocked).
 * Matches the user object shown in the demo spec responses.
 */
export type SafeUser = Omit<User, 'password' | 'isBlocked'>;

/**
 * Input required to create a new user.
 */
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}
