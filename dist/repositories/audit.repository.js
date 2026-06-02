"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let AuditRepository = class AuditRepository {
    constructor() {
        this.store = new Map();
    }
    log(entry) {
        const record = {
            ...entry,
            id: (0, uuid_1.v4)(),
            createdAt: new Date().toISOString(),
        };
        this.store.set(record.id, record);
        return record;
    }
    findAll(query) {
        let entries = Array.from(this.store.values());
        if (query.action)
            entries = entries.filter((e) => e.action === query.action);
        if (query.entityType)
            entries = entries.filter((e) => e.entityType === query.entityType);
        if (query.actorId)
            entries = entries.filter((e) => e.actorId === query.actorId);
        if (query.workspaceId)
            entries = entries.filter((e) => e.workspaceId === query.workspaceId);
        if (query.from)
            entries = entries.filter((e) => new Date(e.createdAt) >= query.from);
        if (query.to)
            entries = entries.filter((e) => new Date(e.createdAt) <= query.to);
        entries = entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const total = entries.length;
        const limit = query.limit ?? 50;
        const offset = query.offset ?? 0;
        return { entries: entries.slice(offset, offset + limit), total };
    }
    findByEntityId(entityId) {
        return Array.from(this.store.values())
            .filter((e) => e.entityId === entityId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    findAll_raw() {
        return Array.from(this.store.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
};
exports.AuditRepository = AuditRepository;
exports.AuditRepository = AuditRepository = __decorate([
    (0, common_1.Injectable)()
], AuditRepository);
//# sourceMappingURL=audit.repository.js.map