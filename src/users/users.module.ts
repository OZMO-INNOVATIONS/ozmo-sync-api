import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AttendanceModule } from '../attendance/attendance.module';
import { AuthModule } from '../auth/auth.module';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [AuthModule, AttendanceModule, InvitationsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
