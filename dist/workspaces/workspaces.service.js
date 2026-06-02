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
exports.WorkspacesService = void 0;
const common_1 = require("@nestjs/common");
const workspaces_repository_1 = require("../repositories/workspaces.repository");
const audit_service_1 = require("../audit/audit.service");
let WorkspacesService = class WorkspacesService {
    constructor(workspacesRepo, auditService) {
        this.workspacesRepo = workspacesRepo;
        this.auditService = auditService;
    }
    listWorkspaces() {
        return this.workspacesRepo.findAll();
    }
    getWorkspace(id) {
        const workspace = this.workspacesRepo.findById(id);
        if (!workspace)
            throw new common_1.NotFoundException('Workspace not found');
        return workspace;
    }
    createWorkspace(dto, actor) {
        const workspace = this.workspacesRepo.create({
            name: dto.name,
            domain: dto.domain,
            plan: dto.plan,
            isActive: true,
            memberCount: 0,
            adminEmail: dto.adminEmail,
        });
        this.auditService.log({
            action: 'WORKSPACE_CREATED',
            entityType: 'WORKSPACE',
            entityId: workspace.id,
            actorId: actor.id,
            actorName: actor.email,
            detail: `Workspace "${workspace.name}" created`,
        });
        return workspace;
    }
    updateWorkspace(id, dto, actor) {
        const existing = this.workspacesRepo.findById(id);
        if (!existing)
            throw new common_1.NotFoundException('Workspace not found');
        const updated = this.workspacesRepo.updateById(id, {
            name: dto.name,
            domain: dto.domain,
            plan: dto.plan,
            adminEmail: dto.adminEmail,
        });
        this.auditService.log({
            action: 'WORKSPACE_UPDATED',
            entityType: 'WORKSPACE',
            entityId: id,
            actorId: actor.id,
            actorName: actor.email,
            detail: `Workspace "${existing.name}" updated`,
        });
        return updated;
    }
    suspendWorkspace(id, dto, actor) {
        const workspace = this.workspacesRepo.findById(id);
        if (!workspace)
            throw new common_1.NotFoundException('Workspace not found');
        if (!workspace.isActive) {
            throw new common_1.ConflictException('Workspace is already suspended');
        }
        const activeCount = this.workspacesRepo.countActive();
        if (activeCount <= 1) {
            throw new common_1.UnprocessableEntityException('Cannot suspend the last active workspace');
        }
        const now = new Date().toISOString();
        const updated = this.workspacesRepo.updateById(id, {
            isActive: false,
            suspendedAt: now,
            suspendedBy: actor.id,
            suspensionReason: dto.reason,
            unsuspendedAt: undefined,
        });
        this.auditService.log({
            action: 'WORKSPACE_SUSPENDED',
            entityType: 'WORKSPACE',
            entityId: id,
            actorId: actor.id,
            actorName: actor.email,
            detail: `Workspace "${workspace.name}" suspended — ${dto.reason}`,
        });
        return {
            id: updated.id,
            name: updated.name,
            isActive: false,
            suspendedAt: now,
            suspendedBy: actor.email,
            memberCount: updated.memberCount,
            membersNotified: dto.notifyMembers ?? false,
        };
    }
    unsuspendWorkspace(id, dto, actor) {
        const workspace = this.workspacesRepo.findById(id);
        if (!workspace)
            throw new common_1.NotFoundException('Workspace not found');
        if (workspace.isActive) {
            throw new common_1.ConflictException('Workspace is not suspended');
        }
        const now = new Date().toISOString();
        const updated = this.workspacesRepo.updateById(id, {
            isActive: true,
            unsuspendedAt: now,
            suspendedAt: undefined,
            suspendedBy: undefined,
            suspensionReason: undefined,
        });
        this.auditService.log({
            action: 'WORKSPACE_UNSUSPENDED',
            entityType: 'WORKSPACE',
            entityId: id,
            actorId: actor.id,
            actorName: actor.email,
            detail: `Workspace "${workspace.name}" reinstated — ${dto.reason}`,
        });
        return {
            id: updated.id,
            name: updated.name,
            isActive: true,
            unsuspendedAt: now,
            reinstatedBy: actor.email,
            memberCount: updated.memberCount,
            membersNotified: dto.notifyMembers ?? false,
        };
    }
};
exports.WorkspacesService = WorkspacesService;
exports.WorkspacesService = WorkspacesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [workspaces_repository_1.WorkspacesRepository,
        audit_service_1.AuditService])
], WorkspacesService);
//# sourceMappingURL=workspaces.service.js.map