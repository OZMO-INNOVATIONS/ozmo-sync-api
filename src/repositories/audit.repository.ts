import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogEntity {
  id: string;
  workspaceId?: string;
  userId?: string;
  module: string;
  action: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(entry: any): AuditLogEntity {
    return {
      id: entry.id,
      workspaceId: entry.workspaceId ?? undefined,
      userId: entry.userId ?? undefined,
      module: entry.module,
      action: entry.action,
      oldData: entry.oldData,
      newData: entry.newData,
      ipAddress: entry.ipAddress ?? undefined,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  async log(entry: {
    workspaceId?: string;
    userId?: string;
    module: string;
    action: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
  }): Promise<AuditLogEntity> {
    const record = await this.prisma.auditLog.create({
      data: {
        workspaceId: entry.workspaceId,
        userId: entry.userId,
        module: entry.module,
        action: entry.action,
        oldData: entry.oldData,
        newData: entry.newData,
        ipAddress: entry.ipAddress,
      },
    });
    return this.mapToEntity(record);
  }

  async findAll(query: {
    action?: string;
    module?: string;
    userId?: string;
    workspaceId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: AuditLogEntity[]; total: number }> {
    const where: any = { deletedAt: null };
    if (query.action) where.action = query.action;
    if (query.module) where.module = query.module;
    if (query.userId) where.userId = query.userId;
    if (query.workspaceId) where.workspaceId = query.workspaceId;

    const total = await this.prisma.auditLog.count({ where });
    const entries = await this.prisma.auditLog.findMany({
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

  async findByEntityId(entityId: string): Promise<AuditLogEntity[]> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entityId);
    if (!isUuid) {
      return [];
    }
    const logs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { id: entityId },
          { workspaceId: entityId },
          { userId: entityId },
        ],
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((e) => this.mapToEntity(e));
  }
}
