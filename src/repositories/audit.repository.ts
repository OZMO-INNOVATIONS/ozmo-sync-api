import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction as PrismaAuditAction } from '@prisma/client';

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
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(entry: any): AuditEntry {
    return {
      id: entry.id,
      action: entry.action as AuditAction,
      entityType: entry.entityType,
      entityId: entry.entityId ?? undefined,
      actorId: entry.actorId ?? undefined,
      actorName: entry.actorName ?? undefined,
      ipAddress: entry.ipAddress ?? undefined,
      workspaceId: entry.workspaceId ?? undefined,
      detail: entry.detail ?? undefined,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  async log(entry: Omit<AuditEntry, 'id' | 'createdAt'>): Promise<AuditEntry> {
    const record = await this.prisma.auditEntry.create({
      data: {
        action: entry.action as PrismaAuditAction,
        entityType: entry.entityType,
        entityId: entry.entityId,
        actorId: entry.actorId,
        actorName: entry.actorName,
        ipAddress: entry.ipAddress,
        workspaceId: entry.workspaceId,
        detail: entry.detail,
      },
    });
    return this.mapToEntity(record);
  }

  async findAll(query: AuditQueryParams): Promise<{ entries: AuditEntry[]; total: number }> {
    const where: any = {};
    if (query.action) where.action = query.action as PrismaAuditAction;
    if (query.entityType) where.entityType = query.entityType;
    if (query.actorId) where.actorId = query.actorId;
    if (query.workspaceId) where.workspaceId = query.workspaceId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = query.from;
      if (query.to) where.createdAt.lte = query.to;
    }

    const total = await this.prisma.auditEntry.count({ where });
    const entries = await this.prisma.auditEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 50,
      skip: query.offset ?? 0,
    });

    return {
      entries: entries.map((e) => this.mapToEntity(e)),
      total,
    };
  }

  async findByEntityId(entityId: string): Promise<AuditEntry[]> {
    const entries = await this.prisma.auditEntry.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    });
    return entries.map((e) => this.mapToEntity(e));
  }

  async findAll_raw(): Promise<AuditEntry[]> {
    const entries = await this.prisma.auditEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return entries.map((e) => this.mapToEntity(e));
  }
}
