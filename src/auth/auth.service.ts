import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { UserRepository, UserEntity } from '../repositories/user.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { InvitationRepository } from '../repositories/invitation.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangeInitialPasswordDto } from './dto/change-initial-password.dto';
import { Role, UserStatus } from '../common/constants/roles.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly workspacesRepo: WorkspacesRepository,
    private readonly invitationRepo: InvitationRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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

    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);
    const employeeId = await this._generateEmployeeId();

    let workspace: any;
    let finalRole = dto.role ?? Role.ADMIN;

    if (dto.token) {
      // 1. Resolve and validate invitation
      const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
      const invite = await this.invitationRepo.findByTokenHash(tokenHash);
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

      // Enforce the invited role
      finalRole = invite.role as unknown as Role;

      // Find and update the associated workspace
      const foundWorkspace = await this.workspacesRepo.findById(invite.workspaceId);
      if (!foundWorkspace) {
        throw new NotFoundException('Associated workspace not found');
      }

      workspace = await this.workspacesRepo.updateById(foundWorkspace.id, {
        memberCount: foundWorkspace.memberCount + 1,
      });

      // Consume the invitation
      await this.invitationRepo.updateStatus(invite.id, 'accepted', new Date());
    } else {
      // If registering without token, they must provide workspace name
      if (!dto.workspaceName) {
        throw new BadRequestException('Workspace name is required when not registering with an invite token');
      }

      // Create new workspace
      workspace = await this.workspacesRepo.create({
        name: dto.workspaceName,
        domain: undefined,
        plan: 'FREE',
        isActive: true,
        memberCount: 1,
        adminEmail: dto.email,
        logoUrl: dto.logo,

        companyName: dto.companyName,
        businessType: dto.businessType,
        industryType: dto.industryType,
        companySize: dto.companySize,
        country: dto.country,
        website: dto.website,
        companyEmail: dto.companyEmail,
        companyPhone: dto.companyPhone,
        companyAddress: dto.companyAddress,
        companyDescription: dto.companyDescription,

        attendanceMethod: dto.attendanceMethod,
        defaultWorkingHours: dto.defaultWorkingHours,
        weekendDays: dto.weekendDays ?? [],
        leavePolicy: dto.leavePolicy,

        pushNotifications: dto.notifications?.pushNotifications ?? true,
        attendanceAlerts: dto.notifications?.attendanceAlerts ?? true,
        leaveAlerts: dto.notifications?.leaveAlerts ?? true,
        taskAlerts: dto.notifications?.taskAlerts ?? true,
        birthdayAlerts: dto.notifications?.birthdayAlerts ?? true,
      });
    }

    // 2. Create the user
    const user = await this.userRepo.create({
      fullName: dto.fullName || `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      role: finalRole,
      designation: dto.designation,
      department: dto.department,
      employeeId,
      status: UserStatus.ACTIVE,
      refreshToken: null,
      workspaceId: workspace ? workspace.id : '',
      workspaceName: workspace ? workspace.name : undefined,
      isFirstLogin: false,
    });

    const tokens = await this._issueTokens(user);
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

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const tokens = await this._issueTokens(user);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isFirstLogin: user.isFirstLogin,
      user: this._sanitize(user),
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
    if (!user?.refreshToken) {
      throw new UnauthorizedException('Refresh token not recognised — please log in again');
    }

    const isMatch = await bcrypt.compare(rawToken, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token mismatch — possible reuse detected');
    }

    const tokens = await this._issueTokens(user);
    return { ...tokens, user: this._sanitize(user) };
  }

  async logout(userId: string): Promise<void> {
    await this.userRepo.saveRefreshToken(userId, null);
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

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Invalid current password');
    }

    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.userRepo.updateById(userId, {
      password: hashedPassword,
      isFirstLogin: false,
      passwordChangedAt: new Date().toISOString(),
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException('Please complete registration first');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
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

  private async _issueTokens(user: UserEntity) {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    const accessToken = this.jwtService.sign(jwtPayload);

    const refreshToken = jwt.sign(
      { sub: user.id },
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-jwt-refresh-secret-key-do-not-use-in-production-123456789',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES', '7d') as any,
        algorithm: 'HS256',
      },
    );

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.saveRefreshToken(user.id, hashedRefresh);

    return { accessToken, refreshToken };
  }

  private _sanitize(user: UserEntity) {
    const { password, refreshToken, ...safe } = user;
    void password; void refreshToken;
    return safe;
  }

  private async _generateEmployeeId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = (await this.userRepo.count(true)) + 1;
    return `OZ-${year}-${String(count).padStart(4, '0')}`;
  }
}
