import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'user' | 'superadmin';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string; // bcrypt-hashed
  role: UserRole;
  isBlocked: boolean;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

class MockUserStore {
  private users: User[] = [];
  private nextId = 1;

  /**
   * Seed the store with initial mock users.
   * Called once at startup.
   */
  async seed(): Promise<void> {
    const salt = await bcrypt.genSalt(12);

    this.users = [
      {
        id: this.nextId++,
        name: 'John Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('123456', salt),
        role: 'user',
        isBlocked: false,
        createdAt: new Date('2025-01-15'),
      },
      {
        id: this.nextId++,
        name: 'Jane Admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', salt),
        role: 'admin',
        isBlocked: false,
        createdAt: new Date('2025-01-10'),
      },
      {
        id: this.nextId++,
        name: 'Super Admin',
        email: 'super@example.com',
        password: await bcrypt.hash('super123', salt),
        role: 'superadmin',
        isBlocked: false,
        createdAt: new Date('2025-01-01'),
      },
      {
        id: this.nextId++,
        name: 'Blocked User',
        email: 'blocked@example.com',
        password: await bcrypt.hash('blocked123', salt),
        role: 'user',
        isBlocked: true,
        createdAt: new Date('2025-02-01'),
      },
    ];
  }

  /**
   * Find a user by email. Returns undefined if not found.
   */
  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  /**
   * Find a user by ID.
   */
  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  /**
   * Compare a plain-text password against the stored hash.
   */
  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Create a new user and add it to the in-memory store.
   */
  createUser(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): User {
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

  /**
   * Return all users with passwords stripped.
   */
  getAllUsers(): Omit<User, 'password'>[] {
    return this.users.map((u) => this.sanitizeUser(u));
  }

  /**
   * Set a user's blocked status.
   */
  setBlockedStatus(id: number, isBlocked: boolean): Omit<User, 'password'> | undefined {
    const user = this.findById(id);
    if (!user) return undefined;
    user.isBlocked = isBlocked;
    return this.sanitizeUser(user);
  }

  /**
   * Update a user's role.
   */
  updateRole(id: number, role: UserRole): Omit<User, 'password'> | undefined {
    const user = this.findById(id);
    if (!user) return undefined;
    user.role = role;
    return this.sanitizeUser(user);
  }

  /**
   * Return a safe user object without the password field.
   */
  sanitizeUser(user: User): Omit<User, 'password'> {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}

// Singleton instance
export const userStore = new MockUserStore();
