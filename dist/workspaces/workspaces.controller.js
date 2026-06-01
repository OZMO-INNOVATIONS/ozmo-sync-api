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
exports.WorkspacesController = void 0;
const common_1 = require("@nestjs/common");
const workspaces_service_1 = require("./workspaces.service");
const create_workspace_dto_1 = require("./dto/create-workspace.dto");
const update_workspace_dto_1 = require("./dto/update-workspace.dto");
const suspend_workspace_dto_1 = require("./dto/suspend-workspace.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_enum_1 = require("../common/constants/roles.enum");
let WorkspacesController = class WorkspacesController {
    constructor(workspacesService) {
        this.workspacesService = workspacesService;
    }
    listWorkspaces() {
        const data = this.workspacesService.listWorkspaces();
        return { message: 'Workspaces retrieved', data };
    }
    getWorkspace(id) {
        const data = this.workspacesService.getWorkspace(id);
        return { message: 'Workspace retrieved', data };
    }
    createWorkspace(dto, user) {
        const data = this.workspacesService.createWorkspace(dto, user);
        return { message: 'Workspace created', data };
    }
    updateWorkspace(id, dto, user) {
        const data = this.workspacesService.updateWorkspace(id, dto, user);
        return { message: 'Workspace updated', data };
    }
    suspendWorkspace(id, dto, user) {
        const data = this.workspacesService.suspendWorkspace(id, dto, user);
        return { message: 'Workspace suspended successfully', data };
    }
    unsuspendWorkspace(id, dto, user) {
        const data = this.workspacesService.unsuspendWorkspace(id, dto, user);
        return { message: 'Workspace reinstated successfully', data };
    }
};
exports.WorkspacesController = WorkspacesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "listWorkspaces", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "getWorkspace", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_workspace_dto_1.CreateWorkspaceDto, Object]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "createWorkspace", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_workspace_dto_1.UpdateWorkspaceDto, Object]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "updateWorkspace", null);
__decorate([
    (0, common_1.Put)(':id/suspend'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, suspend_workspace_dto_1.SuspendWorkspaceDto, Object]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "suspendWorkspace", null);
__decorate([
    (0, common_1.Put)(':id/unsuspend'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, suspend_workspace_dto_1.SuspendWorkspaceDto, Object]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "unsuspendWorkspace", null);
exports.WorkspacesController = WorkspacesController = __decorate([
    (0, common_1.Controller)({ path: 'workspaces', version: '1' }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __metadata("design:paramtypes", [workspaces_service_1.WorkspacesService])
], WorkspacesController);
//# sourceMappingURL=workspaces.controller.js.map