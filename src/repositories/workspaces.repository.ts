import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceStatus, WorkspacePlan } from '@prisma/client';
export { WorkspacePlan };

export interface WorkspaceEntity {
  id: string;
  workspaceCode: string;
  name: string;
  slug: string;
  logoUrl?: string;
  ownerId: string;
  subscriptionId?: string;
  status: WorkspaceStatus;
  plan: WorkspacePlan;
  adminEmail?: string;
  isActive: boolean;
  memberCount: number;
  domain?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  unsuspendedAt?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(ws: any): WorkspaceEntity {
    return {
      id: ws.id,
      workspaceCode: ws.workspaceCode,
      name: ws.name,
      slug: ws.slug,
      logoUrl: ws.logoUrl ?? undefined,
      ownerId: ws.ownerId,
      subscriptionId: ws.subscriptionId ?? undefined,
      status: ws.status as WorkspaceStatus,
      plan: ws.plan as WorkspacePlan,
      adminEmail: ws.adminEmail ?? undefined,
      isActive: ws.isActive,
      memberCount: ws.memberCount,
      domain: ws.domain ?? undefined,
      suspendedAt: ws.suspendedAt ? ws.suspendedAt.toISOString() : undefined,
      suspendedBy: ws.suspendedBy ?? undefined,
      suspensionReason: ws.suspensionReason ?? undefined,
      unsuspendedAt: ws.unsuspendedAt ? ws.unsuspendedAt.toISOString() : undefined,
      createdAt: ws.createdAt,
      updatedAt: ws.updatedAt,
      deletedAt: ws.deletedAt ?? undefined,
      createdBy: ws.createdBy ?? undefined,
      updatedBy: ws.updatedBy ?? undefined,
    };
  }

  async create(dto: {
    name: string;
    slug: string;
    workspaceCode: string;
    ownerId: string;
    logoUrl?: string;
    subscriptionId?: string;
    status?: WorkspaceStatus;
    plan?: WorkspacePlan;
    adminEmail?: string;
    isActive?: boolean;
    memberCount?: number;
    domain?: string;
    createdBy?: string;
  }): Promise<WorkspaceEntity> {
    const ws = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        workspaceCode: dto.workspaceCode,
        ownerId: dto.ownerId,
        logoUrl: dto.logoUrl,
        subscriptionId: dto.subscriptionId,
        status: dto.status ?? WorkspaceStatus.ACTIVE,
        plan: dto.plan ?? WorkspacePlan.FREE,
        adminEmail: dto.adminEmail,
        isActive: dto.isActive ?? true,
        memberCount: dto.memberCount ?? 0,
        domain: dto.domain,
        createdBy: dto.createdBy,
      },
    });
    return this.mapToEntity(ws);
  }

  async findAll(): Promise<WorkspaceEntity[]> {
    const wss = await this.prisma.workspace.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return wss.map((w) => this.mapToEntity(w));
  }

  async findById(id: string): Promise<WorkspaceEntity | null> {
    const ws = await this.prisma.workspace.findFirst({
      where: { id, deletedAt: null },
    });
    return ws ? this.mapToEntity(ws) : null;
  }

  async countActive(): Promise<number> {
    return this.prisma.workspace.count({
      where: { isActive: true, deletedAt: null },
    });
  }

  async updateById(id: string, updates: Partial<WorkspaceEntity>): Promise<WorkspaceEntity | null> {
    try {
      const data: any = {};
      if (updates.name !== undefined) data.name = updates.name;
      if (updates.slug !== undefined) data.slug = updates.slug;
      if (updates.logoUrl !== undefined) data.logoUrl = updates.logoUrl;
      if (updates.ownerId !== undefined) data.ownerId = updates.ownerId;
      if (updates.subscriptionId !== undefined) data.subscriptionId = updates.subscriptionId;
      if (updates.status !== undefined) data.status = updates.status;
      if (updates.plan !== undefined) data.plan = updates.plan;
      if (updates.adminEmail !== undefined) data.adminEmail = updates.adminEmail;
      if (updates.isActive !== undefined) data.isActive = updates.isActive;
      if (updates.memberCount !== undefined) data.memberCount = updates.memberCount;
      if (updates.domain !== undefined) data.domain = updates.domain;
      if (updates.deletedAt !== undefined) data.deletedAt = updates.deletedAt;
      if (updates.updatedBy !== undefined) data.updatedBy = updates.updatedBy;
      if (updates.suspendedAt !== undefined) data.suspendedAt = updates.suspendedAt ? new Date(updates.suspendedAt) : null;
      if (updates.suspendedBy !== undefined) data.suspendedBy = updates.suspendedBy;
      if (updates.suspensionReason !== undefined) data.suspensionReason = updates.suspensionReason;
      if (updates.unsuspendedAt !== undefined) data.unsuspendedAt = updates.unsuspendedAt ? new Date(updates.unsuspendedAt) : null;

      const ws = await this.prisma.workspace.update({
        where: { id },
        data,
      });
      return this.mapToEntity(ws);
    } catch (e) {
      console.error('Error in WorkspacesRepository.updateById:', e);
      return null;
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.workspace.update({
        where: { id },
        data: { deletedAt: new Date(), status: WorkspaceStatus.DELETED, isActive: false },
      });
      return true;
    } catch (e) {
      console.error('Error in WorkspacesRepository.deleteById:', e);
      return false;
    }
  }
}
