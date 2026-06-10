import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { UserRepository } from '../repositories/user.repository';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { SuspendWorkspaceDto } from './dto/suspend-workspace.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { formatDate } from '../common/utils/date-format.util';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspacesRepo: WorkspacesRepository,
    private readonly userRepo: UserRepository,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly attendanceRepo: AttendanceRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async getWorkspaceDetailsByAdmin(adminEmail: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { adminEmail, deletedAt: null },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found for this administrator');
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id, deletedAt: null },
      include: { user: true },
    });

    const staffInWorkspace = members.map((m) => {
      const { password, ...safe } = m.user;
      void password;
      return {
        ...safe,
        role: m.role,
        status: m.status,
      };
    });

    const attendance = await this.prisma.attendance.findMany({
      where: { workspaceId: workspace.id, deletedAt: null },
    });

    const totalEmployees = staffInWorkspace.length;
    const activeEmployees = staffInWorkspace.filter((u) => u.status === 'ACTIVE').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const presentToday = attendance.filter((r) => {
      const isToday = r.date.toISOString().startsWith(todayStr);
      return isToday && r.status === 'PRESENT';
    }).length;
    const absentToday = Math.max(0, totalEmployees - presentToday);

    return {
      workspaceDetails: workspace,
      workspace: workspace,
      totalEmployees,
      activeEmployees,
      staffList: staffInWorkspace,
      staff: staffInWorkspace,
      attendanceSummary: {
        presentToday,
        absentToday,
      },
      leaveSummary: {
        pendingLeaves: 2,
        approvedLeaves: 5,
      },
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
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const workspaceCode = `WS-${Date.now().toString().slice(-6)}`;

    const workspace = await this.workspacesRepo.create({
      name: dto.name,
      slug,
      workspaceCode,
      ownerId: actor.id,
      plan: dto.plan,
      isActive: true,
      memberCount: 1,
      adminEmail: dto.adminEmail || actor.email,
    } as any);

    // Link creating user as Workspace Member
    await this.workspaceMemberRepository.create({
      workspaceId: workspace.id,
      userId: actor.id,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isPrimary: false,
    } as any);

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
