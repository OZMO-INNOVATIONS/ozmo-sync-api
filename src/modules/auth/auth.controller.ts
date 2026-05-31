import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';

/**
 * AuthController
 *
 * Handles all authentication-related endpoints under /api/v1/auth.
 *
 * - login, register, refresh are public (no JWT required).
 * - logout requires a valid Bearer token.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Login ───────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/login
   *
   * Authenticates with email + password and returns JWT tokens.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto.email, dto.password);
    return { message: 'Login successful', data };
  }

  // ─── Register ────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/register
   *
   * Creates a new user account and returns tokens.
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(
      dto.name,
      dto.email,
      dto.password,
    );
    return { message: 'Registration successful', data };
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/refresh
   *
   * Exchanges a valid refresh token for a new access token + refresh token pair.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const data = await this.authService.refresh(dto.refreshToken);
    return { message: 'Tokens refreshed', data };
  }

  // ─── Logout ──────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/logout
   *
   * Logs out the current user.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    this.authService.logout();
    return { message: 'Logged out successfully', data: {} };
  }
}
