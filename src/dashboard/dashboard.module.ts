import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService, AttendanceRepository, WorkspacesRepository],
})
export class DashboardModule {}
