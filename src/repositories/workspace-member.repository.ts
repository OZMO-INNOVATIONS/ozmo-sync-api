import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus } from '../common/constants/roles.enum';

export interface WorkspaceMemberEntity {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string;
  joiningDate?: Date;
  isPrimary: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

@Injectable()
export class WorkspaceMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    workspaceId: string;
    userId: string;
    role: Role;
    departmentId?: string;
    designationId?: string;
    reportingManagerId?: string;
    joiningDate?: Date;
    isPrimary?: boolean;
    status?: UserStatus;
    createdBy?: string;
  }): Promise<WorkspaceMemberEntity> {
    const created = await this.prisma.workspaceMember.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        role: data.role,
        departmentId: data.departmentId,
        designationId: data.designationId,
        reportingManagerId: data.reportingManagerId,
        joiningDate: data.joiningDate,
        isPrimary: data.isPrimary ?? false,
        status: data.status ?? UserStatus.INVITED,
        createdBy: data.createdBy,
      },
    });
    return created as unknown as WorkspaceMemberEntity;
  }

  async findByWorkspaceAndUser(workspaceId: string, userId: string): Promise<WorkspaceMemberEntity | null> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
    return member as unknown as WorkspaceMemberEntity | null;
  }

  async findPrimaryMember(userId: string): Promise<WorkspaceMemberEntity | null> {
    const member = await this.prisma.workspaceMember.findFirst({
      where: {
        userId,
        isPrimary: true,
      },
    });
    if (member) return member as unknown as WorkspaceMemberEntity;

    // Fallback to any active membership
    const fallback = await this.prisma.workspaceMember.findFirst({
      where: { userId },
    });
    return fallback as unknown as WorkspaceMemberEntity | null;
  }

  async findUserMemberships(userId: string): Promise<WorkspaceMemberEntity[]> {
    const members = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });
    return members as unknown as WorkspaceMemberEntity[];
  }

  async setPrimary(workspaceId: string, userId: string): Promise<void> {
    // Set all other memberships of this user to not primary
    await this.prisma.workspaceMember.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });

    // Set the target membership to primary
    await this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      data: { isPrimary: true },
    });
  }

  async updateMember(
    workspaceId: string,
    userId: string,
    updates: Partial<Omit<WorkspaceMemberEntity, 'id' | 'workspaceId' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<WorkspaceMemberEntity> {
    const updated = await this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      data: {
        role: updates.role,
        departmentId: updates.departmentId,
        designationId: updates.designationId,
        reportingManagerId: updates.reportingManagerId,
        joiningDate: updates.joiningDate,
        isPrimary: updates.isPrimary,
        status: updates.status,
        updatedBy: updates.updatedBy,
      },
    });
    return updated as unknown as WorkspaceMemberEntity;
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await this.prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
  }
}
