import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getLogs(query: AuditQueryDto): {
        message: string;
        data: {
            entries: {
                id: string;
                action: import("../repositories/audit.repository").AuditAction;
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
    };
    getEntityLog(entityId: string): {
        message: string;
        data: {
            id: string;
            action: import("../repositories/audit.repository").AuditAction;
            entityType: string;
            entityId: string | undefined;
            actor: string;
            actorId: string | undefined;
            ipAddress: string | undefined;
            workspaceId: string | undefined;
            detail: string | undefined;
            timestamp: string;
        }[];
    };
}
