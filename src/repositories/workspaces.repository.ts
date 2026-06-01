import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export type WorkspacePlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface WorkspaceEntity {
  id: string;
  name: string;
  domain?: string;
  plan: WorkspacePlan;
  isActive: boolean;
  memberCount: number;
  adminEmail?: string;
  logoUrl?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  unsuspendedAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class WorkspacesRepository {
  private readonly store = new Map<string, WorkspaceEntity>();

  create(dto: Omit<WorkspaceEntity, 'id' | 'createdAt' | 'updatedAt'>): WorkspaceEntity {
    const entity: WorkspaceEntity = {
      ...dto,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(entity.id, entity);
    return entity;
  }

  findAll(): WorkspaceEntity[] {
    return Array.from(this.store.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  findById(id: string): WorkspaceEntity | null {
    return this.store.get(id) ?? null;
  }

  countActive(): number {
    return Array.from(this.store.values()).filter((w) => w.isActive).length;
  }

  updateById(id: string, updates: Partial<WorkspaceEntity>): WorkspaceEntity | null {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  deleteById(id: string): boolean {
    return this.store.delete(id);
  }
}
