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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettingsService = void 0;
const common_1 = require("@nestjs/common");
const system_settings_repository_1 = require("../repositories/system-settings.repository");
const audit_service_1 = require("../audit/audit.service");
let SystemSettingsService = class SystemSettingsService {
    constructor(settingsRepo, auditService) {
        this.settingsRepo = settingsRepo;
        this.auditService = auditService;
    }
    getSettings() {
        return this.settingsRepo.get();
    }
    updateSettings(dto, actor) {
        const current = this.settingsRepo.get();
        const updated = this.settingsRepo.update({
            branding: dto.branding,
            modules: dto.modules,
            security: dto.security,
            notifications: dto.notifications,
        }, actor.id);
        const disabledAudit = current.security.auditLogging === true && dto.security?.auditLogging === false;
        this.auditService.log({
            action: 'SETTINGS_UPDATED',
            entityType: 'SYSTEM_SETTINGS',
            entityId: updated.id,
            actorId: actor.id,
            actorName: actor.email,
            detail: disabledAudit
                ? 'System settings updated — audit logging disabled'
                : 'System settings updated',
        });
        return { updatedAt: updated.updatedAt };
    }
};
exports.SystemSettingsService = SystemSettingsService;
exports.SystemSettingsService = SystemSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [system_settings_repository_1.SystemSettingsRepository,
        audit_service_1.AuditService])
], SystemSettingsService);
//# sourceMappingURL=system-settings.service.js.map