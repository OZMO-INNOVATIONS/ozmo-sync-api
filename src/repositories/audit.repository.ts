import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_UPDATED'
  | 'WORKSPACE_SUSPENDED'
  | 'WORKSPACE_UNSUSPENDED'
  | 'SETTINGS_UPDATED'
  | 'JOB_POSTED'
  | 'JOB_CLOSED'
  | 'CANDIDATE_APPLIED'
  | 'DATA_EXPORTED'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorName?: string;
  ipAddress?: string;
  workspaceId?: string;
  detail?: string;
  createdAt: string;
}

export interface AuditQueryParams {
  action?: string;
  entityType?: string;
  actorId?: string;
  workspaceId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditRepository {
  private readonly store = new Map<string, AuditEntry>();

  log(entry: Omit<AuditEntry, 'id' | 'createdAt'>): AuditEntry {
    const record: AuditEntry = {
      ...entry,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    this.store.set(record.id, record);
    return record;
  }

  findAll(query: AuditQueryParams): { entries: AuditEntry[]; total: number } {
    let entries = Array.from(this.store.values());

    if (query.action) entries = entries.filter((e) => e.action === query.action);
    if (query.entityType) entries = entries.filter((e) => e.entityType === query.entityType);
    if (query.actorId) entries = entries.filter((e) => e.actorId === query.actorId);
    if (query.workspaceId) entries = entries.filter((e) => e.workspaceId === query.workspaceId);
    if (query.from) entries = entries.filter((e) => new Date(e.createdAt) >= query.from!);
    if (query.to) entries = entries.filter((e) => new Date(e.createdAt) <= query.to!);

    entries = entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = entries.length;
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    return { entries: entries.slice(offset, offset + limit), total };
  }

  findByEntityId(entityId: string): AuditEntry[] {
    return Array.from(this.store.values())
      .filter((e) => e.entityId === entityId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  findAll_raw(): AuditEntry[] {
    return Array.from(this.store.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
}
