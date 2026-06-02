import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { AuditService } from '../audit/audit.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { SuspendWorkspaceDto } from './dto/suspend-workspace.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';
export declare class WorkspacesService {
    private readonly workspacesRepo;
    private readonly auditService;
    constructor(workspacesRepo: WorkspacesRepository, auditService: AuditService);
    listWorkspaces(): import("../repositories/workspaces.repository").WorkspaceEntity[];
    getWorkspace(id: string): import("../repositories/workspaces.repository").WorkspaceEntity;
    createWorkspace(dto: CreateWorkspaceDto, actor: RequestUser): import("../repositories/workspaces.repository").WorkspaceEntity;
    updateWorkspace(id: string, dto: UpdateWorkspaceDto, actor: RequestUser): import("../repositories/workspaces.repository").WorkspaceEntity | null;
    suspendWorkspace(id: string, dto: SuspendWorkspaceDto, actor: RequestUser): {
        id: string;
        name: string;
        isActive: boolean;
        suspendedAt: string;
        suspendedBy: string;
        memberCount: number;
        membersNotified: boolean;
    };
    unsuspendWorkspace(id: string, dto: SuspendWorkspaceDto, actor: RequestUser): {
        id: string;
        name: string;
        isActive: boolean;
        unsuspendedAt: string;
        reinstatedBy: string;
        memberCount: number;
        membersNotified: boolean;
    };
}
