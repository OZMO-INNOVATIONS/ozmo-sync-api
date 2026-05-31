import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import jwt from 'jsonwebtoken';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

/**
 * AuthModule — exposes authentication endpoints and the JWT strategy.
 *
 * The JwtModule is registered globally (isGlobal: false here — it's local to
 * this module because we configure it in the root AppModule for simplicity).
 *
 * --- Security considerations ---
 *  - JWT secret and expiry are read from environment variables.
 *  - Token expiry is intentionally short (default 1h for access, 7d for refresh).
 *  - Refresh tokens use a separate secret.
 */
@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as jwt.SignOptions['expiresIn'],
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
