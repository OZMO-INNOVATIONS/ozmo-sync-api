import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffProfileRepository } from '../repositories/staff-profile.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StaffController],
  providers: [StaffService, StaffProfileRepository],
})
export class StaffModule {}
