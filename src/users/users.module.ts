import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AttendanceModule } from '../attendance/attendance.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, AttendanceModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
