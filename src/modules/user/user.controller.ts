import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

/**
 * UserController
 *
 * Handles authenticated user endpoints under /api/v1/user.
 *
 * - profile returns the authenticated user's profile.
 */
@Controller('user')
export class UserController {
  constructor(private readonly authService: AuthService) {}

  // ─── Profile ─────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/user/profile
   *
   * Returns the authenticated user's profile.
   * Protected — requires a valid Bearer token.
   */
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  getProfile(@CurrentUser() user: JwtPayload) {
    const userData = this.authService.getProfile(user.sub);
    return {
      message: 'Profile fetched successfully',
      data: { user: userData },
    };
  }
}
