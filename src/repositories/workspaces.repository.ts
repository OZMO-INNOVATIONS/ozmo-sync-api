import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacePlan as PrismaWorkspacePlan } from '@prisma/client';

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

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(ws: any): WorkspaceEntity {
    return {
      id: ws.id,
      name: ws.name,
      domain: ws.domain ?? undefined,
      plan: ws.plan as WorkspacePlan,
      isActive: ws.isActive,
      memberCount: ws.memberCount,
      adminEmail: ws.adminEmail ?? undefined,
      logoUrl: ws.logoUrl ?? undefined,
      suspendedAt: ws.suspendedAt ? ws.suspendedAt.toISOString() : undefined,
      suspendedBy: ws.suspendedBy ?? undefined,
      suspensionReason: ws.suspensionReason ?? undefined,
      unsuspendedAt: ws.unsuspendedAt ? ws.unsuspendedAt.toISOString() : undefined,
      createdAt: ws.createdAt.toISOString(),
      updatedAt: ws.updatedAt.toISOString(),
    };
  }

  async create(dto: Omit<WorkspaceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkspaceEntity> {
    const ws = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        domain: dto.domain,
        plan: dto.plan as PrismaWorkspacePlan,
        isActive: dto.isActive,
        memberCount: dto.memberCount,
        adminEmail: dto.adminEmail,
        logoUrl: dto.logoUrl,
        suspendedAt: dto.suspendedAt ? new Date(dto.suspendedAt) : null,
        suspendedBy: dto.suspendedBy,
        suspensionReason: dto.suspensionReason,
        unsuspendedAt: dto.unsuspendedAt ? new Date(dto.unsuspendedAt) : null,
      },
    });
    return this.mapToEntity(ws);
  }

  async findAll(): Promise<WorkspaceEntity[]> {
    const wss = await this.prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return wss.map((w) => this.mapToEntity(w));
  }

  async findById(id: string): Promise<WorkspaceEntity | null> {
    const ws = await this.prisma.workspace.findUnique({ where: { id } });
    return ws ? this.mapToEntity(ws) : null;
  }

  async countActive(): Promise<number> {
    return this.prisma.workspace.count({
      where: { isActive: true },
    });
  }

  async updateById(id: string, updates: Partial<WorkspaceEntity>): Promise<WorkspaceEntity | null> {
    try {
      const data: any = { ...updates };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;

      if (updates.plan) data.plan = updates.plan as PrismaWorkspacePlan;
      if (updates.suspendedAt !== undefined) data.suspendedAt = updates.suspendedAt ? new Date(updates.suspendedAt) : null;
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
      await this.prisma.workspace.delete({ where: { id } });
      return true;
    } catch (e) {
      console.error('Error in WorkspacesRepository.deleteById:', e);
      return false;
    }
  }
}
