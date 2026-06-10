import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { UserRepository } from '../../repositories/user.repository';
import { WorkspaceMemberRepository } from '../../repositories/workspace-member.repository';
import { UserStatus, Role } from '../../common/constants/roles.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-key-do-not-use-in-production-123456789',
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    let activeWorkspaceId = payload.workspaceId;
    let activeRole = user.role; // Default/Global role

    if (activeWorkspaceId) {
      const membership = await this.workspaceMemberRepository.findByWorkspaceAndUser(activeWorkspaceId, user.id);
      if (!membership) {
        throw new UnauthorizedException('User is not a member of this workspace');
      }
      if (membership.status !== UserStatus.ACTIVE && membership.status !== UserStatus.INVITED) {
        throw new UnauthorizedException('Workspace membership is inactive or suspended');
      }
      activeRole = membership.role;
    } else {
      // If no workspace context in JWT, lookup primary workspace
      const primaryMember = await this.workspaceMemberRepository.findPrimaryMember(user.id);
      if (primaryMember) {
        activeWorkspaceId = primaryMember.workspaceId;
        activeRole = user.role === Role.SUPER_ADMIN ? Role.SUPER_ADMIN : primaryMember.role;
      }
    }

    return {
      id: user.id,
      email: user.email,
      role: activeRole,
      employeeId: user.employeeId ?? undefined,
      workspaceId: activeWorkspaceId ?? undefined,
      isFirstLogin: user.isFirstLogin,
    };
  }
}
