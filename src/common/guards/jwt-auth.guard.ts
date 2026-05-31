import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Extends Passport's built-in JWT guard to support the @Public() decorator.
 *
 * Routes decorated with @Public() skip authentication entirely.
 * All other routes require a valid Bearer JWT token.
 *
 * Error messages match the demo spec exactly.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  override handleRequest<TUser = unknown>(err: Error, user: TUser): TUser {
    if (err || !user) {
      const message = err?.message;

      // TokenExpiredError from jsonwebtoken
      if (message && message.includes('expired')) {
        throw new UnauthorizedException('Access token expired — please refresh');
      }

      // JsonWebTokenError (malformed, wrong secret, etc.)
      if (err) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // No user means no token was provided
      throw new UnauthorizedException(
        'No token provided — Bearer <token> required',
      );
    }
    return user;
  }
}
