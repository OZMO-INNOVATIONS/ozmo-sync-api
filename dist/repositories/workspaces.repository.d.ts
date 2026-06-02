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
export declare class WorkspacesRepository {
    private readonly store;
    create(dto: Omit<WorkspaceEntity, 'id' | 'createdAt' | 'updatedAt'>): WorkspaceEntity;
    findAll(): WorkspaceEntity[];
    findById(id: string): WorkspaceEntity | null;
    countActive(): number;
    updateById(id: string, updates: Partial<WorkspaceEntity>): WorkspaceEntity | null;
    deleteById(id: string): boolean;
}
