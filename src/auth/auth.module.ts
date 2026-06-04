import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserRepository } from '../repositories/user.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { InvitationRepository } from '../repositories/invitation.repository';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET') || 'dev-jwt-secret-key-do-not-use-in-production-123456789',
        signOptions: {
          expiresIn: cfg.get<string>('JWT_EXPIRES_IN', '15m'),
          algorithm: 'HS256',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    UserRepository,
    WorkspacesRepository,
    InvitationRepository,
  ],
  exports: [UserRepository, PassportModule],
})
export class AuthModule {}
