import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * UserModule
 *
 * Exposes authenticated user profile endpoints under /api/v1/user.
 */
@Module({
  imports: [AuthModule],
  controllers: [UserController],
})
export class UserModule {}
