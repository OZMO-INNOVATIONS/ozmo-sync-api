import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator that extracts the authenticated user (or a specific
 * property thereof) from the incoming request.
 *
 * Usage:
 *   @Get('me')
 *   getProfile(@CurrentUser() user: JwtPayload) { ... }
 *
 *   @Get('me')
 *   getProfile(@CurrentUser('email') email: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a specific property is requested (e.g. 'email'), return only that.
    return data ? user?.[data] : user;
  },
);
