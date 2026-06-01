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
export declare class AuditService {
    private readonly auditRepo;
    constructor(auditRepo: AuditRepository);
    log(options: LogEntryOptions): AuditEntry;
    getLogs(query: AuditQueryDto): {
        entries: {
            id: string;
            action: AuditAction;
            entityType: string;
            entityId: string | undefined;
            actor: string;
            actorId: string | undefined;
            ipAddress: string | undefined;
            workspaceId: string | undefined;
            detail: string | undefined;
            timestamp: string;
        }[];
        total: number;
        limit: number;
        offset: number;
    };
    getEntityLog(entityId: string): {
        id: string;
        action: AuditAction;
        entityType: string;
        entityId: string | undefined;
        actor: string;
        actorId: string | undefined;
        ipAddress: string | undefined;
        workspaceId: string | undefined;
        detail: string | undefined;
        timestamp: string;
    }[];
    private _format;
}
