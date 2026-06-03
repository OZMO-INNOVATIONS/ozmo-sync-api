import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { UserRepository } from '../../repositories/user.repository';
import { UserStatus } from '../../common/constants/roles.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-key-do-not-use-in-production-123456789',
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };
  }
}
