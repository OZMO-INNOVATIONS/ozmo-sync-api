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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const export_query_dto_1 = require("./dto/export-query.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_enum_1 = require("../common/constants/roles.enum");
const audit_service_1 = require("../audit/audit.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ReportsController = class ReportsController {
    constructor(reportsService, auditService) {
        this.reportsService = reportsService;
        this.auditService = auditService;
    }
    exportData(query, user, res) {
        const { content, filename, mimeType } = this.reportsService.export(query);
        this.auditService.log({
            action: 'DATA_EXPORTED',
            entityType: query.module,
            actorId: user.id,
            actorName: user.email,
            detail: `Exported ${query.module} as ${query.format} — ${filename}`,
        });
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('export'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [export_query_dto_1.ExportQueryDto, Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "exportData", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)({ path: 'reports', version: '1' }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.HR, roles_enum_1.Role.SUPER_ADMIN),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        audit_service_1.AuditService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map