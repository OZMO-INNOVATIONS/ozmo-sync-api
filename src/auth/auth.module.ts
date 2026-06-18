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
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const secret = cfg.get<string>('JWT_SECRET') || 'dev-jwt-secret-key-do-not-use-in-production-123456789';
        const expiresIn = cfg.get<string>('JWT_EXPIRES_IN', '15m');
        const signOptions: any = { algorithm: 'HS256' };
        if (expiresIn && expiresIn !== 'never') {
          signOptions.expiresIn = expiresIn;
        }
        return {
          secret,
          signOptions,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    UserRepository,
    WorkspacesRepository,
    InvitationRepository,
    WorkspaceMemberRepository,
  ],
  exports: [UserRepository, WorkspaceMemberRepository, PassportModule, JwtModule],
})
export class AuthModule {}
