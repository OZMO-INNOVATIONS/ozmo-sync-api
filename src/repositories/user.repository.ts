import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Role, UserStatus } from '../common/constants/roles.enum';

export interface UserEntity {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  designation?: string;
  department?: string;
  joiningDate?: string;
  status: UserStatus;
  createdAt: string;
  refreshToken: string | null;
}

@Injectable()
export class UserRepository {
  private readonly store = new Map<string, UserEntity>();

  findAll(): UserEntity[] {
    return Array.from(this.store.values());
  }

  findById(id: string): UserEntity | null {
    return this.store.get(id) ?? null;
  }

  findByEmail(email: string): UserEntity | null {
    const normalized = email.toLowerCase();
    for (const user of this.store.values()) {
      if (user.email === normalized) return user;
    }
    return null;
  }

  findByEmployeeId(employeeId: string): UserEntity | null {
    for (const user of this.store.values()) {
      if (user.employeeId === employeeId) return user;
    }
    return null;
  }

  create(dto: Omit<UserEntity, 'id' | 'createdAt'>): UserEntity {
    const entity: UserEntity = {
      ...dto,
      id: uuidv4(),
      email: dto.email.toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    this.store.set(entity.id, entity);
    return entity;
  }

  updateById(id: string, updates: Partial<UserEntity>): UserEntity | null {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.store.set(id, updated);
    return updated;
  }

  saveRefreshToken(id: string, token: string | null): void {
    this.updateById(id, { refreshToken: token });
  }

  deleteById(id: string): boolean {
    return this.store.delete(id);
  }

  count(): number {
    return this.store.size;
  }

  search(query: string): UserEntity[] {
    const q = query.toLowerCase();
    return Array.from(this.store.values()).filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.includes(q) ||
        u.employeeId.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q),
    );
  }

  filter(criteria: { department?: string; status?: UserStatus; role?: Role }): UserEntity[] {
    return Array.from(this.store.values()).filter((u) => {
      if (criteria.department && u.department !== criteria.department) return false;
      if (criteria.status && u.status !== criteria.status) return false;
      if (criteria.role && u.role !== criteria.role) return false;
      return true;
    });
  }
}
