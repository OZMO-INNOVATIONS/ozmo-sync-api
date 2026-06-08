import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

export interface InvitationEntity {
  id: string;
  workspaceId: string;
  invitedBy: string;
  name: string;
  email: string;
  role: string;
  tokenHash: string;
  status: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class InvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(invite: any): InvitationEntity {
    return {
      id: invite.id,
      workspaceId: invite.workspaceId,
      invitedBy: invite.invitedBy,
      name: invite.name,
      email: invite.email,
      role: invite.role,
      tokenHash: invite.tokenHash,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      acceptedAt: invite.acceptedAt ? invite.acceptedAt.toISOString() : undefined,
      createdAt: invite.createdAt.toISOString(),
      updatedAt: invite.updatedAt.toISOString(),
    };
  }

  async create(dto: Omit<InvitationEntity, 'id' | 'createdAt' | 'updatedAt' | 'acceptedAt'>): Promise<InvitationEntity> {
    const invite = await this.prisma.invitation.create({
      data: {
        workspaceId: dto.workspaceId,
        invitedBy: dto.invitedBy,
        name: dto.name,
        email: dto.email.toLowerCase().trim(),
        role: dto.role as Role,
        tokenHash: dto.tokenHash,
        status: dto.status,
        expiresAt: new Date(dto.expiresAt),
      },
    });
    return this.mapToEntity(invite);
  }

  async findByTokenHash(tokenHash: string): Promise<InvitationEntity | null> {
    const invite = await this.prisma.invitation.findFirst({
      where: { tokenHash },
    });
    return invite ? this.mapToEntity(invite) : null;
  }

  async findByEmailAndStatus(email: string, status: string): Promise<InvitationEntity | null> {
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

  async findById(id: string): Promise<InvitationEntity | null> {
    const invite = await this.prisma.invitation.findUnique({
      where: { id },
    });
    return invite ? this.mapToEntity(invite) : null;
  }

  async updateStatus(id: string, status: string, acceptedAt?: Date): Promise<InvitationEntity | null> {
    try {
      const invite = await this.prisma.invitation.update({
        where: { id },
        data: { 
          status,
          ...(acceptedAt !== undefined && { acceptedAt }),
        },
      });
      return this.mapToEntity(invite);
    } catch (e) {
      console.error('Error in InvitationRepository.updateStatus:', e);
      return null;
    }
  }

  async updateTokenAndExpiration(id: string, tokenHash: string, expiresAt: Date): Promise<InvitationEntity | null> {
    try {
      const invite = await this.prisma.invitation.update({
        where: { id },
        data: { 
          tokenHash,
          expiresAt,
          status: 'pending',
        },
      });
      return this.mapToEntity(invite);
    } catch (e) {
      console.error('Error in InvitationRepository.updateTokenAndExpiration:', e);
      return null;
    }
  }
}
