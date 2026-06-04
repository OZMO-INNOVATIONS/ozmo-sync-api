import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { UserRepository } from '../repositories/user.repository';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { AuditService } from '../audit/audit.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { SuspendWorkspaceDto } from './dto/suspend-workspace.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspacesRepo: WorkspacesRepository,
    private readonly userRepo: UserRepository,
    private readonly attendanceRepo: AttendanceRepository,
    private readonly auditService: AuditService,
  ) {}

  async getWorkspaceDetailsByAdmin(adminEmail: string) {
    const workspaces = await this.workspacesRepo.findAll();
    const workspace = workspaces.find((w) => w.adminEmail === adminEmail);
    if (!workspace) {
      throw new NotFoundException('Workspace not found for this administrator');
    }

    const staff = await this.userRepo.findAll();
    const sanitizedStaff = staff.map((u) => {
      const { password, refreshToken, ...safe } = u;
      return safe;
    });

    const attendance = await this.attendanceRepo.findAll();

    return {
      workspace,
      staff: sanitizedStaff,
      attendance,
      leaves: [],
    };
  }

  async listWorkspaces() {
    return await this.workspacesRepo.findAll();
  }

  async getWorkspace(id: string) {
    const workspace = await this.workspacesRepo.findById(id);
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async createWorkspace(dto: CreateWorkspaceDto, actor: RequestUser) {
    const workspace = await this.workspacesRepo.create({
      name: dto.name,
      domain: dto.domain,
      plan: dto.plan,
      isActive: true,
      memberCount: 0,
      adminEmail: dto.adminEmail,
    });

    await this.auditService.log({
      action: 'WORKSPACE_CREATED',
      entityType: 'WORKSPACE',
      entityId: workspace.id,
      actorId: actor.id,
      actorName: actor.email,
      detail: `Workspace "${workspace.name}" created`,
    });

    return workspace;
  }

  async updateWorkspace(id: string, dto: UpdateWorkspaceDto, actor: RequestUser) {
    const existing = await this.workspacesRepo.findById(id);
    if (!existing) throw new NotFoundException('Workspace not found');

    const updated = await this.workspacesRepo.updateById(id, {
      name: dto.name,
      domain: dto.domain,
      plan: dto.plan,
      adminEmail: dto.adminEmail,
    });

    await this.auditService.log({
      action: 'WORKSPACE_UPDATED',
      entityType: 'WORKSPACE',
      entityId: id,
      actorId: actor.id,
      actorName: actor.email,
      detail: `Workspace "${existing.name}" updated`,
    });

    return updated;
  }

  async suspendWorkspace(id: string, dto: SuspendWorkspaceDto, actor: RequestUser) {
    const workspace = await this.workspacesRepo.findById(id);
    if (!workspace) throw new NotFoundException('Workspace not found');
    if (!workspace.isActive) {
      throw new ConflictException('Workspace is already suspended');
    }

    const activeCount = await this.workspacesRepo.countActive();
    if (activeCount <= 1) {
      throw new UnprocessableEntityException('Cannot suspend the last active workspace');
    }

    const now = new Date().toISOString();
    const updated = await this.workspacesRepo.updateById(id, {
      isActive: false,
      suspendedAt: now,
      suspendedBy: actor.id,
      suspensionReason: dto.reason,
      unsuspendedAt: undefined,
    });

    await this.auditService.log({
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

  async unsuspendWorkspace(id: string, dto: SuspendWorkspaceDto, actor: RequestUser) {
    const workspace = await this.workspacesRepo.findById(id);
    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.isActive) {
      throw new ConflictException('Workspace is not suspended');
    }

    const now = new Date().toISOString();
    const updated = await this.workspacesRepo.updateById(id, {
      isActive: true,
      unsuspendedAt: now,
      suspendedAt: undefined,
      suspendedBy: undefined,
      suspensionReason: undefined,
    });

    await this.auditService.log({
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
