"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacesRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let WorkspacesRepository = class WorkspacesRepository {
    constructor() {
        this.store = new Map();
    }
    create(dto) {
        const entity = {
            ...dto,
            id: (0, uuid_1.v4)(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.store.set(entity.id, entity);
        return entity;
    }
    findAll() {
        return Array.from(this.store.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    findById(id) {
        return this.store.get(id) ?? null;
    }
    countActive() {
        return Array.from(this.store.values()).filter((w) => w.isActive).length;
    }
    updateById(id, updates) {
        const existing = this.store.get(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        this.store.set(id, updated);
        return updated;
    }
    deleteById(id) {
        return this.store.delete(id);
    }
};
exports.WorkspacesRepository = WorkspacesRepository;
exports.WorkspacesRepository = WorkspacesRepository = __decorate([
    (0, common_1.Injectable)()
], WorkspacesRepository);
//# sourceMappingURL=workspaces.repository.js.map