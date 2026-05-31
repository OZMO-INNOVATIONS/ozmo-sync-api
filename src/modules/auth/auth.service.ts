import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './strategies/jwt.strategy';
import { SafeUser } from '../users/interfaces/user.interface';

/**
 * Shape returned by login and register.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

/**
 * AuthService — handles authentication business logic.
 *
 * Each method throws standard NestJS HTTP exceptions on failure so the
 * global exception filter produces consistent error responses automatically.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Token helpers ──────────────────────────────────────────────────────────

  private generateTokens(user: { id: number; email: string; role: string }): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET ?? 'fallback-refresh-secret',
      { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] },
    );

    return { accessToken, refreshToken };
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  /**
   * Authenticate a user by email and password.
   *
   * @returns Access token, refresh token, and the safe user profile.
   * @throws NotFoundException  if the email does not match any user.
   * @throws ForbiddenException if the account is blocked.
   * @throws UnauthorizedException if the password is wrong.
   */
  async login(email: string, password: string): Promise<AuthTokens> {
    const user = this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isBlocked) {
      throw new ForbiddenException('Your account has been blocked');
    }

    const valid = await this.usersService.validatePassword(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = this.generateTokens(user);
    const safeUser = this.usersService.sanitize(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: safeUser,
    };
  }

  // ─── Register ────────────────────────────────────────────────────────────

  /**
   * Register a new user account and return tokens immediately.
   *
   * @throws ConflictException if the email is already taken.
   */
  async register(name: string, email: string, password: string): Promise<AuthTokens> {
    const safeUser = await this.usersService.register(name, email, password);

    // Need the full user to generate tokens — re-fetch by email
    const user = this.usersService.findByEmail(email);
    if (!user) {
      throw new Error('User not found after registration — this should never happen');
    }

    const tokens = this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: safeUser,
    };
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────

  /**
   * Validate a refresh token and return a new token pair.
   *
   * @throws UnauthorizedException if the refresh token is invalid/expired
   *         or the user no longer exists.
   * @throws ForbiddenException if the user is blocked.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let decoded: { sub: number; email: string };

    try {
      decoded = this.jwtService.verify<{ sub: number; email: string }>(
        refreshToken,
        { secret: process.env.JWT_REFRESH_SECRET ?? 'fallback-refresh-secret' },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = this.usersService.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (user.isBlocked) {
      throw new ForbiddenException('Your account has been blocked');
    }

    const tokens = this.generateTokens(user);
    const safeUser = this.usersService.sanitize(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: safeUser,
    };
  }

  // ─── Logout ──────────────────────────────────────────────────────────────

  /**
   * Logout a user.
   *
   * Since JWTs are stateless, true invalidation requires a token blocklist
   * (e.g. Redis). For now this is a no-op that returns a success message.
   */
  logout(): void {
    // Token blocklist logic goes here in production
    return;
  }

  // ─── Profile ─────────────────────────────────────────────────────────────

  /**
   * Return the authenticated user's safe profile.
   *
   * @throws NotFoundException if the user does not exist.
   */
  getProfile(userId: number): SafeUser {
    const user = this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.usersService.sanitize(user);
  }
}
