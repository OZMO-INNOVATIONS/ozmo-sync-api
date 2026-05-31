import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by the JwtAuthGuard to determine if a route is public.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator that marks a route handler as publicly accessible, bypassing
 * the global JWT authentication guard.
 *
 * Usage:
 *   @Public()
 *   @Post('login')
 *   login(@Body() dto: LoginDto) { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
