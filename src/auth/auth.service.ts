import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { UserRepository, UserEntity } from '../repositories/user.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { InvitationRepository } from '../repositories/invitation.repository';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangeInitialPasswordDto } from './dto/change-initial-password.dto';
import { Role, UserStatus } from '../common/constants/roles.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly workspacesRepo: WorkspacesRepository,
    private readonly invitationRepo: InvitationRepository,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    let firstName = dto.firstName || '';
    let lastName = dto.lastName || '';
    if (dto.fullName) {
      const parts = dto.fullName.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    if (!firstName) {
      throw new BadRequestException('First name or full name is required');
    }

    let finalRole = Role.SUPER_ADMIN;
    let invite: any = null;

    if (dto.token) {
      // Resolve and validate invitation first, before creating user record
      const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
      invite = await this.invitationRepo.findByTokenHash(tokenHash);
      if (!invite) {
        throw new BadRequestException('Invalid invitation token');
      }

      if (invite.status !== 'pending') {
        throw new BadRequestException(`Invitation is no longer active (status: ${invite.status})`);
      }

      if (new Date(invite.expiresAt).getTime() < Date.now()) {
        await this.invitationRepo.updateStatus(invite.id, 'expired');
        throw new BadRequestException('Invitation has expired');
      }

      if (dto.email.toLowerCase().trim() !== invite.email.toLowerCase().trim()) {
        throw new BadRequestException('Email does not match the invitation email');
      }

      finalRole = invite.role as unknown as Role;
    } else {
      // Public signup is strictly limited to SUPER_ADMIN
      if (dto.role && dto.role !== Role.SUPER_ADMIN) {
        throw new BadRequestException('Only SUPER_ADMIN role can register publicly');
      }
      finalRole = Role.SUPER_ADMIN;
    }

    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    let workspace: any;

    // 1. Create the user globally with their validated role
    const user = await this.userRepo.create({
      firstName,
      lastName,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      status: UserStatus.ACTIVE,
      isFirstLogin: false,
      role: finalRole,
    });

    if (invite) {
      // Find associated workspace
      const foundWorkspace = await this.workspacesRepo.findById(invite.workspaceId);
      if (!foundWorkspace) {
        throw new NotFoundException('Associated workspace not found');
      }

      workspace = await this.workspacesRepo.updateById(foundWorkspace.id, {
        memberCount: foundWorkspace.memberCount + 1,
      });

      // Link User to existing Workspace
      await this.workspaceMemberRepository.create({
        workspaceId: foundWorkspace.id,
        userId: user.id,
        role: finalRole,
        isPrimary: true,
        status: UserStatus.ACTIVE,
      });

      // Update user active workspace context
      await this.userRepo.updateById(user.id, { workspaceId: foundWorkspace.id });

      // Consume the invitation
      await this.invitationRepo.updateStatus(invite.id, 'accepted', new Date());

      // Log invite onboarding event
      await this.auditService.log({
        userId: user.id,
        workspaceId: workspace.id,
        action: 'STAFF_ONBOARDING',
        module: 'AUTH',
        detail: `User accepted invite and joined workspace ${workspace.name} as ${finalRole}`,
      });
    } else {
      // Creating new workspace from scratch (public register)
      const workspaceName = dto.workspaceName || `${firstName}'s Workspace`;
      const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const workspaceCode = `WS-${Date.now().toString().slice(-6)}`;

      // Create new workspace owned by this user
      workspace = await this.workspacesRepo.create({
        name: workspaceName,
        slug,
        workspaceCode,
        ownerId: user.id,
        plan: 'FREE',
        isActive: true,
        memberCount: 1,
        adminEmail: dto.email,
        logoUrl: dto.logo,
      } as any);

      // Link User to Workspace as SUPER_ADMIN (registered owner role)
      await this.workspaceMemberRepository.create({
        workspaceId: workspace.id,
        userId: user.id,
        role: Role.SUPER_ADMIN,
        isPrimary: true,
        status: UserStatus.ACTIVE,
      });

      // Update user active workspace context
      await this.userRepo.updateById(user.id, { workspaceId: workspace.id });

      // Create default workspace settings
      await this.prisma.workspaceSettings.create({
        data: {
          workspaceId: workspace.id,
          branding: dto.logo ? { logo: dto.logo } : {},
          modules: { attendance: true, leaves: true, projects: true, meetings: true },
          security: { mfa: false },
          notifications: { email: true, push: true },
        },
      });

      // Create default leave types
      const leaveTypes = [
        { name: 'Annual Leave', daysAllowed: 15, isPaid: true },
        { name: 'Sick Leave', daysAllowed: 10, isPaid: true },
        { name: 'Casual Leave', daysAllowed: 5, isPaid: true },
      ];
      for (const lt of leaveTypes) {
        await this.prisma.leaveType.create({
          data: {
            workspaceId: workspace.id,
            name: lt.name,
            daysAllowed: lt.daysAllowed,
            isPaid: lt.isPaid,
          },
        });
      }

      // Create default departments
      const departments = ['Engineering', 'Human Resources', 'Sales'];
      for (const dept of departments) {
        await this.prisma.department.create({
          data: {
            workspaceId: workspace.id,
            name: dept,
          },
        });
      }

      // Log workspace registration
      await this.auditService.log({
        userId: user.id,
        workspaceId: workspace.id,
        action: 'SUPER_ADMIN_REGISTRATION',
        module: 'AUTH',
        detail: `Super Admin registered and created workspace ${workspace.name}`,
      });
    }

    const tokens = await this._issueTokens(user, workspace.id, finalRole);
    return { ...tokens, user: this._sanitize(user), workspace };
  }

  async login(dto: LoginDto) {
    if (!dto.email && !dto.employeeId) {
      throw new BadRequestException('Provide either email or employeeId');
    }

    const user = dto.email
      ? await this.userRepo.findByEmail(dto.email)
      : await this.userRepo.findByEmployeeId(dto.employeeId!);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password!);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const memberships = await this.workspaceMemberRepository.findUserMemberships(user.id);
    const primaryMembership = memberships.find((m) => m.isPrimary) || memberships[0];

    const targetWorkspaceId = primaryMembership?.workspaceId;
    const targetRole = primaryMembership ? primaryMembership.role : (user.role === Role.SUPER_ADMIN ? Role.SUPER_ADMIN : Role.STAFF);

    const tokens = await this._issueTokens(user, targetWorkspaceId, targetRole);

    await this.auditService.log({
      userId: user.id,
      workspaceId: targetWorkspaceId || undefined,
      action: 'LOGIN',
      module: 'AUTH',
      detail: `User logged in`,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isFirstLogin: user.isFirstLogin,
      user: this._sanitize(user),
      workspaces: memberships.map((m: any) => ({
        id: m.workspaceId,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        isPrimary: m.isPrimary,
      })),
      activeWorkspaceContext: primaryMembership ? {
        workspaceId: targetWorkspaceId,
        role: targetRole,
      } : null,
    };
  }

  async refresh(rawToken: string) {
    let payload: { sub: string };
    try {
      payload = jwt.verify(
        rawToken,
        this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-jwt-refresh-secret-key-do-not-use-in-production-123456789',
      ) as { sub: string };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // Check if token exists in refreshTokens relation and is not revoked
    const dbToken = await this.prisma.refreshToken.findFirst({
      where: {
        token: rawToken,
        userId: user.id,
        isRevoked: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!dbToken) {
      throw new UnauthorizedException('Refresh token not recognized or expired — please log in again');
    }

    // Extract workspace membership context for default token signing
    const primaryMembership = await this.workspaceMemberRepository.findPrimaryMember(user.id);
    const targetWorkspaceId = primaryMembership?.workspaceId;
    const targetRole = primaryMembership ? primaryMembership.role : (user.role === Role.SUPER_ADMIN ? Role.SUPER_ADMIN : Role.STAFF);

    const tokens = await this._issueTokens(user, targetWorkspaceId, targetRole);
    return { ...tokens, user: this._sanitize(user) };
  }

  async switchWorkspace(userId: string, workspaceId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const membership = await this.workspaceMemberRepository.findByWorkspaceAndUser(workspaceId, user.id);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (membership.status !== UserStatus.ACTIVE && membership.status !== UserStatus.INVITED) {
      throw new ForbiddenException('Your membership in this workspace is suspended or inactive');
    }

    // Update user's active workspace context
    await this.userRepo.updateById(user.id, { workspaceId });

    // Issue new tokens containing this workspace context
    const tokens = await this._issueTokens(user, workspaceId, membership.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      activeWorkspaceContext: {
        workspaceId,
        role: membership.role,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    await this.userRepo.saveRefreshToken(userId, null);
    await this.auditService.log({
      userId,
      workspaceId: user?.workspaceId || undefined,
      action: 'LOGOUT',
      module: 'AUTH',
      detail: `User logged out`,
    });
  }

  async changeInitialPassword(userId: string, dto: ChangeInitialPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isFirstLogin) {
      throw new BadRequestException('Initial password change already completed');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password!);
    if (!isMatch) {
      throw new BadRequestException('Invalid current password');
    }

    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.userRepo.updateById(userId, {
      password: hashedPassword,
      isFirstLogin: false,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password!);
    if (!isMatch) {
      throw new BadRequestException('Invalid current password');
    }

    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.userRepo.updateById(userId, {
      password: hashedPassword,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      return {
        success: true,
        message: 'Password reset link sent if email exists',
      };
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, purpose: 'reset-password' },
      this.configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-key-do-not-use-in-production-123456789',
      { expiresIn: '1h', algorithm: 'HS256' }
    );

    return {
      success: true,
      message: 'Password reset token generated successfully',
      token,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: { sub: string; email: string; purpose: string };
    try {
      payload = jwt.verify(
        dto.token,
        this.configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-key-do-not-use-in-production-123456789',
      ) as any;
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.purpose !== 'reset-password') {
      throw new BadRequestException('Invalid token purpose');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    await this.userRepo.updateById(user.id, {
      password: hashedPassword,
      isFirstLogin: false,
    });

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  private async _issueTokens(user: UserEntity, workspaceId?: string, role?: Role) {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: role ?? user.role,
      employeeId: user.employeeId ?? undefined,
      workspaceId: workspaceId ?? undefined,
    };

    const accessToken = this.jwtService.sign(jwtPayload);

    const refreshToken = jwt.sign(
      { sub: user.id },
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-jwt-refresh-secret-key-do-not-use-in-production-123456789',
      {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES', '7d') as any,
        algorithm: 'HS256',
      },
    );

    // Save token in DB relation
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.saveRefreshToken(user.id, hashedRefresh);

    return { accessToken, refreshToken };
  }

  private _sanitize(user: UserEntity) {
    const { password, ...safe } = user;
    return safe;
  }
}
