import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { AttendanceModule } from './attendance/attendance.module';
import { StaffModule } from './staff/staff.module';
import { AuditModule } from './audit/audit.module';
import { CareersModule } from './careers/careers.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    AuthModule,
    ProfileModule,
    AttendanceModule,
    StaffModule,
    // AuditModule is @Global — register once, AuditService/AuditRepository available everywhere
    AuditModule,
    CareersModule,
    SystemSettingsModule,
    WorkspacesModule,
    UsersModule,
    ReportsModule,
  ],
})
export class AppModule {}
