import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IUsersRepository } from '../interfaces/users-repository.interface';
import { User, SafeUser, CreateUserInput } from '../interfaces/user.interface';
import { UserRole } from '../../../common/decorators/roles.decorator';

/**
 * In-memory implementation of IUsersRepository.
 *
 * Data is stored in a plain array and is LOST on server restart.
 *
 * --- Migration to Prisma ---
 *  1. Add `@prisma/client` and `prisma` to dependencies.
 *  2. Create `prisma/schema.prisma` with the User model.
 *  3. Replace this class with:
 *       class PrismaUsersRepository implements IUsersRepository { ... }
 *  4. Update the provider token in UsersModule.
 */
@Injectable()
export class MockUsersRepository implements IUsersRepository {
  private users: User[] = [];
  private nextId = 1;

  // ─── Seed ────────────────────────────────────────────────────────────────

  async seed(): Promise<void> {
    const salt = await bcrypt.genSalt(12);

    this.users = [
      this.buildSeedUser(1, 'Alice Admin', 'alice@ozmo.io', 'admin', 'Password@123', salt, false, new Date('2025-01-01')),
      this.buildSeedUser(2, 'Bob User', 'bob@ozmo.io', 'user', 'Password@123', salt, false, new Date('2025-01-15')),
      this.buildSeedUser(3, 'Super Admin', 'super@example.com', 'superadmin', 'super123', salt, false, new Date('2025-01-01')),
      this.buildSeedUser(4, 'Blocked User', 'blocked@example.com', 'user', 'blocked123', salt, true, new Date('2025-02-01')),
    ];
    this.nextId = 5;
  }

  private buildSeedUser(
    id: number,
    name: string,
    email: string,
    role: UserRole,
    plainPassword: string,
    salt: string,
    isBlocked: boolean,
    createdAt: Date,
  ): User {
    return {
      id,
      name,
      email,
      password: bcrypt.hashSync(plainPassword, salt),
      role,
      isBlocked,
      createdAt,
    };
  }

  // ─── Queries ─────────────────────────────────────────────────────────────

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  // ─── Password ────────────────────────────────────────────────────────────

  async validatePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  // ─── Mutations ───────────────────────────────────────────────────────────

  create(input: CreateUserInput): User {
    const newUser: User = {
      id: this.nextId++,
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      isBlocked: false,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  // ─── Admin ───────────────────────────────────────────────────────────────

  getAll(): SafeUser[] {
    return this.users.map((u) => this.sanitize(u));
  }

  setBlockedStatus(id: number, blocked: boolean): SafeUser | undefined {
    const user = this.findById(id);
    if (!user) return undefined;
    user.isBlocked = blocked;
    return this.sanitize(user);
  }

  updateRole(id: number, role: string): SafeUser | undefined {
    const user = this.findById(id);
    if (!user) return undefined;
    user.role = role as UserRole;
    return this.sanitize(user);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  sanitize(user: User): SafeUser {
    const { password: _pw, isBlocked: _ib, ...safe } = user;
    return safe;
  }
}
