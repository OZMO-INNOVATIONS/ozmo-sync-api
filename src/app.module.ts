import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { UserModule } from './modules/user/user.module';
import { CommonModule } from './modules/common/common.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

/**
 * Root application module.
 *
 * Registers all feature modules and configures global providers:
 *  - JwtAuthGuard    → applies JWT auth to every route unless @Public()
 *  - RolesGuard      → enforces role-based access where @Roles() is present
 *  - HttpExceptionFilter  → uniform error responses
 *  - ResponseTransformInterceptor → uniform success responses
 */
@Module({
  imports: [AuthModule, UsersModule, AdminModule, UserModule, HealthModule, CommonModule],

  providers: [
    // ── Global Guards ───────────────────────────────────────────────────────
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },

    // ── Global Filters ──────────────────────────────────────────────────────
    { provide: APP_FILTER, useClass: HttpExceptionFilter },

    // ── Global Interceptors ─────────────────────────────────────────────────
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
  ],
})
export class AppModule {}
