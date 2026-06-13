import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { InvitationRepository } from '../repositories/invitation.repository';
import { UserRepository } from '../repositories/user.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { InviteUserDto } from '../users/dto/invite-user.dto';
import { AcceptInviteDto } from '../users/dto/accept-invite.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role, UserStatus } from '../common/constants/roles.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationRepo: InvitationRepository,
    private readonly userRepo: UserRepository,
    private readonly workspacesRepo: WorkspacesRepository,
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
    private readonly auditService: AuditService,
  ) {}

  private normalizeRole(roleStr: string): Role {
    const upper = roleStr.toUpperCase().trim();
    if (upper === 'EMPLOYEE' || upper === 'STAFF') {
      return Role.STAFF;
    }
    if (upper in Role) {
      return Role[upper as keyof typeof Role];
    }
    throw new BadRequestException(
      `Invalid role: ${roleStr}. Choose from: ADMIN, HR, MANAGER, TEAM_LEAD, STAFF, GUEST`,
    );
  }

  private async sendInvitationEmail(
    name: string,
    email: string,
    role: string,
    companyName: string,
    token: string,
  ) {
    const invitationLink = `http://localhost:3000/invite/${token}`;

    const subject = "You're Invited to Join OZMO SYNC";
    const body = `Hello ${name},

You have been invited to join OZMO SYNC under the workspace:

Company: ${companyName}
Role: ${role}

Click the link below to activate your account:

${invitationLink}

This invitation expires in 7 days.

If you did not expect this invitation, please ignore this email.

Regards,
OZMO SYNC Team`;

    console.log(`[EMAIL MOCK] Sending invitation email to ${email}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}\n--------------------`);

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        console.log(`[Resend API] Attempting to send real email via Resend...`);
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: subject,
            text: body,
          }),
        });
        
        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Resend API] Error sending email: ${errText}`);
        } else {
          console.log(`[Resend API] Email sent successfully via Resend API.`);
        }
      } catch (error) {
        console.error('[Resend API] Exception while sending email:', error);
      }
    }
  }

  async createInvitation(dto: InviteUserDto, admin: RequestUser) {
    // 1. Check if user is already registered
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // 2. Check if an invitation is already pending for this email
    const pendingInvite = await this.invitationRepo.findByEmailAndStatus(dto.email, 'pending');
    if (pendingInvite) {
      throw new ConflictException('Invitation already pending');
    }

    // 3. Find the admin's workspace using active context
    if (!admin.workspaceId) {
      throw new BadRequestException('No active workspace context');
    }
    const workspace = await this.workspacesRepo.findById(admin.workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Validate and normalize role
    const finalRole = this.normalizeRole(dto.role);

    // 4. Generate token and expiration date (7 days from now)
    const token = uuidv4();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 5. Create invitation
    const invitation = await this.invitationRepo.create({
      workspaceId: workspace.id,
      invitedBy: admin.id,
      name: dto.name,
      email: dto.email,
      role: finalRole,
      tokenHash,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
    });

    // 6. Send email notification
    const companyName = workspace.name;
    await this.sendInvitationEmail(dto.name, dto.email, finalRole, companyName, token);

    // Log invite audit event
    await this.auditService.log({
      userId: admin.id,
      workspaceId: workspace.id,
      action: 'INVITE_SENT',
      module: 'STAFF',
      newData: { email: dto.email, role: finalRole },
      detail: `Sent invitation to ${dto.email} as ${finalRole}`,
    });

    return {
      invitationId: invitation.id,
      email: invitation.email,
      status: invitation.status,
      token: token,
    };
  }

  async acceptInvitation(dto: AcceptInviteDto) {
    // 1. Find invitation by token hash
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const invitation = await this.invitationRepo.findByTokenHash(tokenHash);
    if (!invitation) {
      throw new NotFoundException('Invitation not found or invalid');
    }

    // 2. Validate invitation status
    if (invitation.status === 'accepted') {
      throw new BadRequestException('Invitation has already been accepted');
    }
    if (invitation.status === 'cancelled') {
      throw new BadRequestException('Invitation has been cancelled');
    }
    if (invitation.status === 'expired') {
      throw new BadRequestException('Invitation has expired');
    }

    // Check if expired by expiration timestamp
    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      await this.invitationRepo.updateStatus(invitation.id, 'expired');
      throw new BadRequestException('Invitation has expired');
    }

    // 3. Find associated workspace
    const workspace = await this.workspacesRepo.findById(invitation.workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // 4. Double check if user already exists
    const existing = await this.userRepo.findByEmail(invitation.email);
    if (existing) {
      throw new ConflictException('User already exists');
    }

    // 5. Parse name
    const nameParts = invitation.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // 6. Hash password and generate employee ID
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    
    const year = new Date().getFullYear();
    const count = (await this.userRepo.count()) + 1;
    const employeeId = `OZ-${year}-${String(count).padStart(4, '0')}`;

    const finalRole = this.normalizeRole(invitation.role);

    // 7. Create user
    const newUser = await this.userRepo.create({
      firstName,
      lastName,
      email: invitation.email,
      password: hashedPassword,
      role: finalRole,
      employeeId,
      status: UserStatus.ACTIVE,
      workspaceId: workspace.id,
      isFirstLogin: false,
    });

    // Create WorkspaceMember
    await this.workspaceMemberRepo.create({
      workspaceId: workspace.id,
      userId: newUser.id,
      role: finalRole,
      status: UserStatus.ACTIVE,
      isPrimary: true,
    });

    // 8. Update workspace member count
    await this.workspacesRepo.updateById(workspace.id, {
      memberCount: workspace.memberCount + 1,
    });

    // 9. Mark invitation as accepted
    await this.invitationRepo.updateStatus(invitation.id, 'accepted', new Date());

    // Log invite accepted event
    await this.auditService.log({
      userId: newUser.id,
      workspaceId: workspace.id,
      action: 'INVITE_ACCEPTED',
      module: 'STAFF',
      newData: { userId: newUser.id, email: newUser.email },
      detail: `Staff accepted invitation and registered account.`,
    });

    return {
      success: true,
      message: 'Account created successfully',
    };
  }

  async resendInvitation(invitationId: string, admin: RequestUser) {
    // 1. Find invitation
    const invitation = await this.invitationRepo.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // 2. Find admin's workspace and verify matching
    if (!admin.workspaceId || invitation.workspaceId !== admin.workspaceId) {
      throw new ForbiddenException('You do not have permission to resend this invitation');
    }
    const workspace = await this.workspacesRepo.findById(admin.workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // 3. Verify status and expiration
    if (invitation.status !== 'pending') {
      throw new BadRequestException('Only pending invitations can be resent');
    }

    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      await this.invitationRepo.updateStatus(invitation.id, 'expired');
      throw new BadRequestException('Invitation has expired');
    }

    // 4. Generate new token/hash and set new expiration (7 days from now)
    const token = uuidv4();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 5. Update invitation
    await this.invitationRepo.updateTokenAndExpiration(invitation.id, tokenHash, expiresAt);

    // 6. Send email
    const companyName = workspace.name;
    await this.sendInvitationEmail(invitation.name, invitation.email, invitation.role, companyName, token);

    return {
      success: true,
      message: 'Invitation resent successfully',
      token: token,
    };
  }

  async cancelInvitation(invitationIdOrToken: string, admin: RequestUser) {
    // 1. Find invitation (try ID first, fallback to token hash)
    let invitation = await this.invitationRepo.findById(invitationIdOrToken);
    if (!invitation) {
      const tokenHash = crypto.createHash('sha256').update(invitationIdOrToken).digest('hex');
      invitation = await this.invitationRepo.findByTokenHash(tokenHash);
    }

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // 2. Find admin's workspace and verify matching
    if (!admin.workspaceId || invitation.workspaceId !== admin.workspaceId) {
      throw new ForbiddenException('You do not have permission to cancel this invitation');
    }

    // 3. Verify status
    if (invitation.status === 'accepted') {
      throw new BadRequestException('Invitation has already been accepted');
    }

    // 4. Update status to cancelled
    await this.invitationRepo.updateStatus(invitation.id, 'REVOKED');

    return {
      id: invitation.id,
      status: 'REVOKED',
    };
  }

  // Deprecated listInvitations if not needed, but keep it for list capabilities if requested.
  async listInvitations(admin: RequestUser) {
    if (!admin.workspaceId) {
      throw new BadRequestException('No active workspace context');
    }
    return await this.invitationRepo.findByWorkspaceId(admin.workspaceId);
  }
}
