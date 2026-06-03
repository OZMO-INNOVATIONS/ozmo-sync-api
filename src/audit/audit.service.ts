import { Injectable } from '@nestjs/common';
import { AuditRepository, AuditAction, AuditEntry } from '../repositories/audit.repository';
import { AuditQueryDto } from './dto/audit-query.dto';

export interface LogEntryOptions {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorName?: string;
  ipAddress?: string;
  workspaceId?: string;
  detail?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly auditRepo: AuditRepository) {}

  async log(options: LogEntryOptions): Promise<AuditEntry> {
    return await this.auditRepo.log(options);
  }

  async getLogs(query: AuditQueryDto) {
    const { entries, total } = await this.auditRepo.findAll({
      action: query.action,
      entityType: query.entityType,
      actorId: query.actorId,
      workspaceId: query.workspaceId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });

    return {
      entries: entries.map(this._format),
      total,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    };
  }

  async getEntityLog(entityId: string) {
    const entries = await this.auditRepo.findByEntityId(entityId);
    return entries.map(this._format);
  }

  private _format(entry: AuditEntry) {
    return {
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actor: entry.actorName ?? entry.actorId ?? 'System',
      actorId: entry.actorId,
      ipAddress: entry.ipAddress,
      workspaceId: entry.workspaceId,
      detail: entry.detail,
      timestamp: entry.createdAt,
    };
  }
}
