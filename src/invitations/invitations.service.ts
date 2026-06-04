import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InvitationRepository, InvitationEntity } from '../repositories/invitation.repository';
import { UserRepository } from '../repositories/user.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { InvitationStatus } from '@prisma/client';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationRepo: InvitationRepository,
    private readonly userRepo: UserRepository,
    private readonly workspacesRepo: WorkspacesRepository,
  ) {}

  async createInvitation(dto: CreateInvitationDto, admin: RequestUser) {
    // 1. Check if user is already registered
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('A user with this email is already registered');
    }

    // 2. Revoke any existing pending invitations for this email
    const pendingInvite = await this.invitationRepo.findByEmailAndStatus(dto.email, InvitationStatus.PENDING);
    if (pendingInvite) {
      await this.invitationRepo.updateStatus(pendingInvite.id, InvitationStatus.REVOKED);
    }

    // 3. Find the admin's workspace
    const workspaces = await this.workspacesRepo.findAll();
    const workspace = workspaces.find((w) => w.adminEmail === admin.email);
    if (!workspace) {
      throw new NotFoundException('No workspace found for the authenticated admin');
    }

    // 4. Generate token and expiration date (7 days from now)
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 5. Create invitation
    const invitation = await this.invitationRepo.create({
      email: dto.email,
      role: dto.role,
      token,
      status: InvitationStatus.PENDING,
      workspaceId: workspace.id,
      invitedById: admin.id,
      expiresAt: expiresAt.toISOString(),
    });

    const signupUrl = `http://localhost:3000/auth/register?token=${token}`;

    return {
      ...invitation,
      signupUrl,
    };
  }

  async listInvitations(admin: RequestUser) {
    // Find the admin's workspace
    const workspaces = await this.workspacesRepo.findAll();
    const workspace = workspaces.find((w) => w.adminEmail === admin.email);
    if (!workspace) {
      throw new NotFoundException('No workspace found for the authenticated admin');
    }

    return await this.invitationRepo.findByWorkspaceId(workspace.id);
  }

  async revokeInvitation(token: string, admin: RequestUser) {
    // 1. Find invitation
    const invitation = await this.invitationRepo.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // 2. Find admin's workspace
    const workspaces = await this.workspacesRepo.findAll();
    const workspace = workspaces.find((w) => w.adminEmail === admin.email);
    if (!workspace) {
      throw new NotFoundException('No workspace found for the authenticated admin');
    }

    // 3. Verify workspace matches
    if (invitation.workspaceId !== workspace.id) {
      throw new ForbiddenException('You do not have permission to revoke this invitation');
    }

    // 4. Verify invitation is pending
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    const updated = await this.invitationRepo.updateStatus(invitation.id, InvitationStatus.REVOKED);
    return updated;
  }
}
