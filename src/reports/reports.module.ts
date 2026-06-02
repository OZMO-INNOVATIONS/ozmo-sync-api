import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AuthModule } from '../auth/auth.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [AuthModule, AttendanceModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
