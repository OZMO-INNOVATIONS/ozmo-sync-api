"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const check_in_dto_1 = require("./dto/check-in.dto");
const check_out_dto_1 = require("./dto/check-out.dto");
const attendance_query_dto_1 = require("./dto/attendance-query.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_enum_1 = require("../common/constants/roles.enum");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    checkIn(user, dto) {
        const data = this.attendanceService.checkIn(user.id, dto);
        return { message: 'Check-in recorded', data };
    }
    checkOut(user, dto) {
        const data = this.attendanceService.checkOut(user.id, dto);
        return { message: 'Check-out recorded', data };
    }
    getMyAttendance(user, query) {
        const data = this.attendanceService.getAttendance(user.id, query);
        return { message: 'Attendance fetched', data };
    }
    getDashboard(query) {
        const data = this.attendanceService.getDashboard(query);
        return { message: 'Dashboard data fetched', data };
    }
    getUserAttendance(userId, query) {
        const data = this.attendanceService.getAttendance(userId, query);
        return { message: 'Attendance fetched', data };
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('check-in'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.STAFF, roles_enum_1.Role.TEAM_LEAD),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, check_in_dto_1.CheckInDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)('check-out'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.STAFF, roles_enum_1.Role.TEAM_LEAD),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, check_out_dto_1.CheckOutDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkOut", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, attendance_query_dto_1.AttendanceQueryDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getMyAttendance", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.HR, roles_enum_1.Role.MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_query_dto_1.AttendanceQueryDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)(':userId'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.HR, roles_enum_1.Role.MANAGER),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, attendance_query_dto_1.AttendanceQueryDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getUserAttendance", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)({ path: 'attendance', version: '1' }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map