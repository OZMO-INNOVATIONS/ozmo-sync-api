import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, InvitationStatus } from '@prisma/client';

export interface InvitationEntity {
  id: string;
  email: string;
  role: Role;
  token: string;
  status: InvitationStatus;
  workspaceId: string;
  invitedById: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class InvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(invite: any): InvitationEntity {
    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      status: invite.status,
      workspaceId: invite.workspaceId,
      invitedById: invite.invitedById,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
      updatedAt: invite.updatedAt.toISOString(),
    };
  }

  async create(dto: Omit<InvitationEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<InvitationEntity> {
    const invite = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        role: dto.role,
        token: dto.token,
        status: dto.status,
        workspaceId: dto.workspaceId,
        invitedById: dto.invitedById,
        expiresAt: new Date(dto.expiresAt),
      },
    });
    return this.mapToEntity(invite);
  }

  async findByToken(token: string): Promise<InvitationEntity | null> {
    const invite = await this.prisma.invitation.findUnique({
      where: { token },
    });
    return invite ? this.mapToEntity(invite) : null;
  }

  async findByEmailAndStatus(email: string, status: InvitationStatus): Promise<InvitationEntity | null> {
    const invite = await this.prisma.invitation.findFirst({
      where: { email: email.toLowerCase().trim(), status },
    });
    return invite ? this.mapToEntity(invite) : null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<InvitationEntity[]> {
    const invites = await this.prisma.invitation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((i) => this.mapToEntity(i));
  }

  async updateStatus(id: string, status: InvitationStatus): Promise<InvitationEntity | null> {
    try {
      const invite = await this.prisma.invitation.update({
        where: { id },
        data: { status },
      });
      return this.mapToEntity(invite);
    } catch (e) {
      console.error('Error in InvitationRepository.updateStatus:', e);
      return null;
    }
  }
}
