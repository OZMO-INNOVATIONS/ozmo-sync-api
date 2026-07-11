import { Injectable } from '@nestjs/common';
import { AuditRepository, AuditLogEntity } from '../repositories/audit.repository';
import { AuditQueryDto } from './dto/audit-query.dto';

export interface LogEntryOptions {
  action: string;
  module?: string;
  userId?: string;
  workspaceId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  entityType?: string; // fallback
  actorId?: string; // fallback
  actorName?: string; // fallback
  detail?: string; // fallback
  entityId?: string; // fallback
}

@Injectable()
export class AuditService {
  constructor(private readonly auditRepo: AuditRepository) {}

  async log(options: LogEntryOptions): Promise<AuditLogEntity> {
    return await this.auditRepo.log({
      workspaceId: options.workspaceId,
      userId: options.userId || options.actorId,
      module: options.module || options.entityType || 'SYSTEM',
      action: options.action,
      oldData: options.oldData,
      newData: options.newData || (options.detail ? { detail: options.detail } : undefined),
      ipAddress: options.ipAddress,
    });
  }

  async getLogs(query: AuditQueryDto) {
    const { entries, total } = await this.auditRepo.findAll({
      action: query.action,
      module: query.entityType,
      userId: query.actorId,
      workspaceId: query.workspaceId,
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
    return entries.map((e) => this._format(e));
  }

  private _format(entry: AuditLogEntity) {
    const actorName = entry.user ? `${entry.user.firstName} ${entry.user.lastName}`.trim() : (entry.userId ?? 'System');
    return {
      id: entry.id,
      action: entry.action,
      entityType: entry.module,
      entityId: entry.id,
      actor: actorName,
      actorId: entry.userId,
      ipAddress: entry.ipAddress,
      workspaceId: entry.workspaceId,
      detail: entry.newData?.detail ?? '',
      timestamp: entry.createdAt,
    };
  }
}
