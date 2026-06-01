import { WorkspacePlan } from '../../repositories/workspaces.repository';
export declare class CreateWorkspaceDto {
    name: string;
    domain?: string;
    plan: WorkspacePlan;
    adminEmail?: string;
}
