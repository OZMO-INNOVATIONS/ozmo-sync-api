import { User, SafeUser, CreateUserInput } from '../interfaces/user.interface';

import { InjectionToken } from '@nestjs/common';

/**
 * Injection token for the UsersRepository provider.
 *
 * Usage:
 *   @Inject(USERS_REPOSITORY) private readonly usersRepo: IUsersRepository
 */
export const USERS_REPOSITORY: InjectionToken = Symbol('USERS_REPOSITORY');

/**
 * Abstract repository interface for User data access.
 *
 * Any implementation (mock, Prisma, TypeORM, etc.) must satisfy this contract.
 * This allows the service layer to stay completely database-agnostic.
 */
export interface IUsersRepository {
  /** Seed the store with initial data (used for dev / demo). */
  seed(): Promise<void>;

  /** Find a single user by email. Returns undefined when not found. */
  findByEmail(email: string): User | undefined;

  /** Find a single user by numeric ID. */
  findById(id: number): User | undefined;

  /** Compare a plain-text password against a stored bcrypt hash. */
  validatePassword(plain: string, hashed: string): Promise<boolean>;

  /** Create and persist a new user. Returns the created user. */
  create(input: CreateUserInput): User;

  /** Return all users (without passwords). */
  getAll(): SafeUser[];

  /** Set or clear the blocked flag on a user. Returns the updated user or undefined. */
  setBlockedStatus(id: number, blocked: boolean): SafeUser | undefined;

  /** Change a user's role. Returns the updated user or undefined. */
  updateRole(id: number, role: string): SafeUser | undefined;

  /** Strip the password from a User object. */
  sanitize(user: User): SafeUser;
}
