import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { SuspendWorkspaceDto } from './dto/suspend-workspace.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';
export declare class WorkspacesController {
    private readonly workspacesService;
    constructor(workspacesService: WorkspacesService);
    listWorkspaces(): {
        message: string;
        data: import("../repositories/workspaces.repository").WorkspaceEntity[];
    };
    getWorkspace(id: string): {
        message: string;
        data: import("../repositories/workspaces.repository").WorkspaceEntity;
    };
    createWorkspace(dto: CreateWorkspaceDto, user: RequestUser): {
        message: string;
        data: import("../repositories/workspaces.repository").WorkspaceEntity;
    };
    updateWorkspace(id: string, dto: UpdateWorkspaceDto, user: RequestUser): {
        message: string;
        data: import("../repositories/workspaces.repository").WorkspaceEntity | null;
    };
    suspendWorkspace(id: string, dto: SuspendWorkspaceDto, user: RequestUser): {
        message: string;
        data: {
            id: string;
            name: string;
            isActive: boolean;
            suspendedAt: string;
            suspendedBy: string;
            memberCount: number;
            membersNotified: boolean;
        };
    };
    unsuspendWorkspace(id: string, dto: SuspendWorkspaceDto, user: RequestUser): {
        message: string;
        data: {
            id: string;
            name: string;
            isActive: boolean;
            unsuspendedAt: string;
            reinstatedBy: string;
            memberCount: number;
            membersNotified: boolean;
        };
    };
}
