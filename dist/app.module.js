"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const profile_module_1 = require("./profile/profile.module");
const attendance_module_1 = require("./attendance/attendance.module");
const staff_module_1 = require("./staff/staff.module");
const audit_module_1 = require("./audit/audit.module");
const careers_module_1 = require("./careers/careers.module");
const system_settings_module_1 = require("./system-settings/system-settings.module");
const workspaces_module_1 = require("./workspaces/workspaces.module");
const users_module_1 = require("./users/users.module");
const reports_module_1 = require("./reports/reports.module");
const health_module_1 = require("./modules/health/health.module");
const common_module_1 = require("./modules/common/common.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_transform_interceptor_1 = require("./common/interceptors/response-transform.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            auth_module_1.AuthModule,
            profile_module_1.ProfileModule,
            attendance_module_1.AttendanceModule,
            staff_module_1.StaffModule,
            audit_module_1.AuditModule,
            careers_module_1.CareersModule,
            system_settings_module_1.SystemSettingsModule,
            workspaces_module_1.WorkspacesModule,
            users_module_1.UsersModule,
            reports_module_1.ReportsModule,
            health_module_1.HealthModule,
            common_module_1.CommonModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            { provide: core_1.APP_FILTER, useClass: http_exception_filter_1.HttpExceptionFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: response_transform_interceptor_1.ResponseTransformInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map