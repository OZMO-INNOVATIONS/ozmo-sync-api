import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../../common/decorators/roles.decorator';

/**
 * Shape of the payload embedded in every access JWT.
 */
export interface JwtPayload {
  sub: number; // user ID
  email: string;
  role: UserRole;
}

/**
 * Passport JWT strategy.
 *
 * On every authenticated request, this strategy:
 *  1. Extracts the Bearer token from the Authorization header.
 *  2. Verifies the token signature and expiry.
 *  3. Calls validate() with the decoded payload.
 *  4. Attaches the returned value to request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production',
    });
  }

  /**
   * Called by Passport after the token is verified.
   *
   * If the user no longer exists, we reject the request even though the
   * token itself is valid (defensive — handles deleted-account edge case).
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // Return the payload — Passport attaches this to request.user
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
