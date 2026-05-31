import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IUsersRepository, USERS_REPOSITORY } from './interfaces/users-repository.interface';
import { SafeUser, CreateUserInput } from './interfaces/user.interface';
import { UserRole } from '../../common/decorators/roles.decorator';

/**
 * UsersService — encapsulates all user-related business logic.
 *
 * Delegates persistence to the injected IUsersRepository, making it
 * straightforward to swap the data store (mock → Prisma → …) without
 * touching this class.
 */
@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly usersRepo: IUsersRepository,
  ) {}

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  /** Seed the repository with demo data. */
  async seed(): Promise<void> {
    await this.usersRepo.seed();
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /** Find a user by email. Returns undefined (not found is not an error here). */
  findByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  /** Find a user by ID. Returns undefined if not found. */
  findById(id: number) {
    return this.usersRepo.findById(id);
  }

  /** Verify a plain-text password against a stored hash. */
  async validatePassword(plain: string, hashed: string): Promise<boolean> {
    return this.usersRepo.validatePassword(plain, hashed);
  }

  /** Return a safe (no password) user object. */
  sanitize(user: Parameters<IUsersRepository['sanitize']>[0]) {
    return this.usersRepo.sanitize(user);
  }

  // ─── Registration ────────────────────────────────────────────────────────

  /**
   * Register a new user.
   *
   * @throws ConflictException if the email is already taken.
   */
  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<SafeUser> {
    const existing = this.usersRepo.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const input: CreateUserInput = {
      name,
      email,
      password: hashedPassword,
      role: 'user',
    };

    const created = this.usersRepo.create(input);
    return this.usersRepo.sanitize(created);
  }

  // ─── Admin operations ────────────────────────────────────────────────────

  /** List every registered user (passwords excluded). */
  getAllUsers(): SafeUser[] {
    return this.usersRepo.getAll();
  }

  /**
   * Block (or unblock) a user.
   *
   * @throws NotFoundException if the user does not exist.
   * @throws ForbiddenException if the requester tries to block themself.
   */
  setBlockedStatus(
    id: number,
    blocked: boolean,
    requesterId?: number,
  ): SafeUser {
    if (requesterId !== undefined && requesterId === id) {
      throw new ForbiddenException('You cannot block your own account');
    }

    const updated = this.usersRepo.setBlockedStatus(id, blocked);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  /**
   * Change a user's role.
   *
   * @throws NotFoundException  if the user does not exist.
   * @throws ForbiddenException if the requester tries to change their own role.
   */
  updateRole(
    id: number,
    role: UserRole,
    requesterRole?: UserRole,
    requesterId?: number,
  ): SafeUser {
    if (requesterId !== undefined && requesterId === id) {
      throw new ForbiddenException('You cannot change your own role');
    }

    // Only a superadmin may assign the superadmin role
    if (role === 'superadmin' && requesterRole !== 'superadmin') {
      throw new ForbiddenException(
        'Only superadmin can assign the superadmin role',
      );
    }

    const updated = this.usersRepo.updateRole(id, role);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }
}
