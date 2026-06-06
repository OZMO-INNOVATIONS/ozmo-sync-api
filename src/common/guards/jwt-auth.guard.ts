import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const activated = await super.canActivate(context);
    if (!activated) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user && user.isFirstLogin) {
      const isChangeInitialPassword = request.url.includes('/auth/change-initial-password');
      const isLogout = request.url.includes('/auth/logout');
      if (!isChangeInitialPassword && !isLogout) {
        throw new UnauthorizedException('Password change required — please complete initial password change workflow');
      }
    }

    return true;
  }

  override handleRequest<TUser = unknown>(err: Error, user: TUser): TUser {
    if (err || !user) {
      const message = err?.message;
      if (message?.includes('expired')) {
        throw new UnauthorizedException('Access token expired — please refresh');
      }
      if (err) throw new UnauthorizedException('Invalid or expired token');
      throw new UnauthorizedException('No token provided — Bearer <token> required');
    }
    return user;
  }
}
