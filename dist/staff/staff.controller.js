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
exports.StaffController = void 0;
const common_1 = require("@nestjs/common");
const staff_service_1 = require("./staff.service");
const create_staff_dto_1 = require("./dto/create-staff.dto");
const update_staff_dto_1 = require("./dto/update-staff.dto");
const staff_filter_dto_1 = require("./dto/staff-filter.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_enum_1 = require("../common/constants/roles.enum");
let StaffController = class StaffController {
    constructor(staffService) {
        this.staffService = staffService;
    }
    async createStaff(dto) {
        const data = await this.staffService.create(dto);
        return { message: 'Staff member created', data };
    }
    listStaff() {
        const data = this.staffService.findAll();
        return { message: 'Staff list fetched', data };
    }
    searchStaff(query) {
        const data = this.staffService.search(query.q);
        return { message: 'Search results', data };
    }
    filterStaff(dto) {
        const data = this.staffService.filter(dto);
        return { message: 'Filtered results', data };
    }
    getStaffById(id) {
        const data = this.staffService.findById(id);
        return { message: 'Staff member fetched', data };
    }
    async updateStaff(id, dto) {
        const data = await this.staffService.update(id, dto);
        return { message: 'Staff member updated', data };
    }
    deleteStaff(id, actor) {
        this.staffService.delete(id, actor.id);
        return { message: 'Staff member deleted', data: {} };
    }
};
exports.StaffController = StaffController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.HR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.CreateStaffDto]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "createStaff", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.HR, roles_enum_1.Role.MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "listStaff", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.HR, roles_enum_1.Role.MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [staff_filter_dto_1.StaffSearchDto]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "searchStaff", null);
__decorate([
    (0, common_1.Get)('filter'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.HR, roles_enum_1.Role.MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [staff_filter_dto_1.StaffFilterDto]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "filterStaff", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.HR, roles_enum_1.Role.MANAGER, roles_enum_1.Role.TEAM_LEAD),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "getStaffById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.HR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_staff_dto_1.UpdateStaffDto]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateStaff", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "deleteStaff", null);
exports.StaffController = StaffController = __decorate([
    (0, common_1.Controller)({ path: 'staff', version: '1' }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [staff_service_1.StaffService])
], StaffController);
//# sourceMappingURL=staff.controller.js.map