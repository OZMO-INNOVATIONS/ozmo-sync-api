import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
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
import { HealthModule } from './modules/health/health.module';
import { CommonModule } from './modules/common/common.module';
import { InvitationsModule } from './invitations/invitations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MeetingsModule } from './meetings/meetings.module';
import { LeavesModule } from './leaves/leaves.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HolidaysModule } from './holidays/holidays.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { RequestLockInterceptor } from './common/interceptors/request-lock.interceptor';
import { WorkspaceIsolationMiddleware } from './common/middleware/workspace-isolation.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    AttendanceModule,
    StaffModule,
    AuditModule,
    CareersModule,
    SystemSettingsModule,
    WorkspacesModule,
    UsersModule,
    ReportsModule,
    HealthModule,
    DashboardModule,
    InvitationsModule,
    MeetingsModule,
    LeavesModule,
    NotificationsModule,
    HolidaysModule,
    CommonModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RequestLockInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WorkspaceIsolationMiddleware)
      .forRoutes('*');
  }
}
