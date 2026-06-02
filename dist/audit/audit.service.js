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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const audit_repository_1 = require("../repositories/audit.repository");
let AuditService = class AuditService {
    constructor(auditRepo) {
        this.auditRepo = auditRepo;
    }
    log(options) {
        return this.auditRepo.log(options);
    }
    getLogs(query) {
        const { entries, total } = this.auditRepo.findAll({
            action: query.action,
            entityType: query.entityType,
            actorId: query.actorId,
            workspaceId: query.workspaceId,
            from: query.from ? new Date(query.from) : undefined,
            to: query.to ? new Date(query.to) : undefined,
            limit: query.limit ?? 50,
            offset: query.offset ?? 0,
        });
        return {
            entries: entries.map(this._format),
            total,
            limit: query.limit ?? 50,
            offset: query.offset ?? 0,
        };
    }
    getEntityLog(entityId) {
        const entries = this.auditRepo.findByEntityId(entityId);
        return entries.map(this._format);
    }
    _format(entry) {
        return {
            id: entry.id,
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId,
            actor: entry.actorName ?? entry.actorId ?? 'System',
            actorId: entry.actorId,
            ipAddress: entry.ipAddress,
            workspaceId: entry.workspaceId,
            detail: entry.detail,
            timestamp: entry.createdAt,
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_repository_1.AuditRepository])
], AuditService);
//# sourceMappingURL=audit.service.js.map