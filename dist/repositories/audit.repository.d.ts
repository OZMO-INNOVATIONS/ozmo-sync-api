export type AuditAction = 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'WORKSPACE_CREATED' | 'WORKSPACE_UPDATED' | 'WORKSPACE_SUSPENDED' | 'WORKSPACE_UNSUSPENDED' | 'SETTINGS_UPDATED' | 'JOB_POSTED' | 'JOB_CLOSED' | 'CANDIDATE_APPLIED' | 'DATA_EXPORTED' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGED';
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
export declare class AuditRepository {
    private readonly store;
    log(entry: Omit<AuditEntry, 'id' | 'createdAt'>): AuditEntry;
    findAll(query: AuditQueryParams): {
        entries: AuditEntry[];
        total: number;
    };
    findByEntityId(entityId: string): AuditEntry[];
    findAll_raw(): AuditEntry[];
}
