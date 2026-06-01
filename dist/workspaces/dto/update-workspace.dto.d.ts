import { WorkspacePlan } from '../../repositories/workspaces.repository';
export declare class UpdateWorkspaceDto {
    name?: string;
    domain?: string;
    plan?: WorkspacePlan;
    adminEmail?: string;
}
