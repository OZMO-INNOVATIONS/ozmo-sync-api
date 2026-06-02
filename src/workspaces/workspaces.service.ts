import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { AuditService } from '../audit/audit.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { SuspendWorkspaceDto } from './dto/suspend-workspace.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspacesRepo: WorkspacesRepository,
    private readonly auditService: AuditService,
  ) {}

  listWorkspaces() {
    return this.workspacesRepo.findAll();
  }

  getWorkspace(id: string) {
    const workspace = this.workspacesRepo.findById(id);
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  createWorkspace(dto: CreateWorkspaceDto, actor: RequestUser) {
    const workspace = this.workspacesRepo.create({
      name: dto.name,
      domain: dto.domain,
      plan: dto.plan,
      isActive: true,
      memberCount: 0,
      adminEmail: dto.adminEmail,
    });

    this.auditService.log({
      action: 'WORKSPACE_CREATED',
      entityType: 'WORKSPACE',
      entityId: workspace.id,
      actorId: actor.id,
      actorName: actor.email,
      detail: `Workspace "${workspace.name}" created`,
    });

    return workspace;
  }

  updateWorkspace(id: string, dto: UpdateWorkspaceDto, actor: RequestUser) {
    const existing = this.workspacesRepo.findById(id);
    if (!existing) throw new NotFoundException('Workspace not found');

    const updated = this.workspacesRepo.updateById(id, {
      name: dto.name,
      domain: dto.domain,
      plan: dto.plan,
      adminEmail: dto.adminEmail,
    });

    this.auditService.log({
      action: 'WORKSPACE_UPDATED',
      entityType: 'WORKSPACE',
      entityId: id,
      actorId: actor.id,
      actorName: actor.email,
      detail: `Workspace "${existing.name}" updated`,
    });

    return updated;
  }

  suspendWorkspace(id: string, dto: SuspendWorkspaceDto, actor: RequestUser) {
    const workspace = this.workspacesRepo.findById(id);
    if (!workspace) throw new NotFoundException('Workspace not found');
    if (!workspace.isActive) {
      throw new ConflictException('Workspace is already suspended');
    }

    const activeCount = this.workspacesRepo.countActive();
    if (activeCount <= 1) {
      throw new UnprocessableEntityException('Cannot suspend the last active workspace');
    }

    const now = new Date().toISOString();
    const updated = this.workspacesRepo.updateById(id, {
      isActive: false,
      suspendedAt: now,
      suspendedBy: actor.id,
      suspensionReason: dto.reason,
      unsuspendedAt: undefined,
    });

    this.auditService.log({
      action: 'WORKSPACE_SUSPENDED',
      entityType: 'WORKSPACE',
      entityId: id,
      actorId: actor.id,
      actorName: actor.email,
      detail: `Workspace "${workspace.name}" suspended — ${dto.reason}`,
    });

    return {
      id: updated!.id,
      name: updated!.name,
      isActive: false,
      suspendedAt: now,
      suspendedBy: actor.email,
      memberCount: updated!.memberCount,
      membersNotified: dto.notifyMembers ?? false,
    };
  }

  unsuspendWorkspace(id: string, dto: SuspendWorkspaceDto, actor: RequestUser) {
    const workspace = this.workspacesRepo.findById(id);
    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.isActive) {
      throw new ConflictException('Workspace is not suspended');
    }

    const now = new Date().toISOString();
    const updated = this.workspacesRepo.updateById(id, {
      isActive: true,
      unsuspendedAt: now,
      suspendedAt: undefined,
      suspendedBy: undefined,
      suspensionReason: undefined,
    });

    this.auditService.log({
      action: 'WORKSPACE_UNSUSPENDED',
      entityType: 'WORKSPACE',
      entityId: id,
      actorId: actor.id,
      actorName: actor.email,
      detail: `Workspace "${workspace.name}" reinstated — ${dto.reason}`,
    });

    return {
      id: updated!.id,
      name: updated!.name,
      isActive: true,
      unsuspendedAt: now,
      reinstatedBy: actor.email,
      memberCount: updated!.memberCount,
      membersNotified: dto.notifyMembers ?? false,
    };
  }
}
