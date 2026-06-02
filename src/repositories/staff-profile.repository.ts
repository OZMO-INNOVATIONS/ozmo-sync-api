import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface StaffProfileEntity {
  id: string;
  userId: string;
  emergencyContact?: string;
  address?: string;
  skills?: string[];
  bio?: string;
  updatedAt: string;
}

@Injectable()
export class StaffProfileRepository {
  private readonly store = new Map<string, StaffProfileEntity>();

  create(dto: Omit<StaffProfileEntity, 'id' | 'updatedAt'>): StaffProfileEntity {
    const profile: StaffProfileEntity = {
      ...dto,
      id: uuidv4(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(profile.userId, profile);
    return profile;
  }

  findByUserId(userId: string): StaffProfileEntity | null {
    return this.store.get(userId) ?? null;
  }

  updateByUserId(
    userId: string,
    updates: Partial<StaffProfileEntity>,
  ): StaffProfileEntity | null {
    const existing = this.store.get(userId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.store.set(userId, updated);
    return updated;
  }

  deleteByUserId(userId: string): boolean {
    return this.store.delete(userId);
  }
}
