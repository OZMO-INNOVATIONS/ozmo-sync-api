"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let UserRepository = class UserRepository {
    constructor() {
        this.store = new Map();
    }
    findAll() {
        return Array.from(this.store.values());
    }
    findById(id) {
        return this.store.get(id) ?? null;
    }
    findByEmail(email) {
        const normalized = email.toLowerCase();
        for (const user of this.store.values()) {
            if (user.email === normalized)
                return user;
        }
        return null;
    }
    findByEmployeeId(employeeId) {
        for (const user of this.store.values()) {
            if (user.employeeId === employeeId)
                return user;
        }
        return null;
    }
    create(dto) {
        const entity = {
            ...dto,
            id: (0, uuid_1.v4)(),
            email: dto.email.toLowerCase(),
            createdAt: new Date().toISOString(),
        };
        this.store.set(entity.id, entity);
        return entity;
    }
    updateById(id, updates) {
        const existing = this.store.get(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...updates };
        this.store.set(id, updated);
        return updated;
    }
    saveRefreshToken(id, token) {
        this.updateById(id, { refreshToken: token });
    }
    deleteById(id) {
        return this.store.delete(id);
    }
    count() {
        return this.store.size;
    }
    search(query) {
        const q = query.toLowerCase();
        return Array.from(this.store.values()).filter((u) => u.firstName.toLowerCase().includes(q) ||
            u.lastName.toLowerCase().includes(q) ||
            u.email.includes(q) ||
            u.employeeId.toLowerCase().includes(q) ||
            u.department?.toLowerCase().includes(q));
    }
    filter(criteria) {
        return Array.from(this.store.values()).filter((u) => {
            if (criteria.department && u.department !== criteria.department)
                return false;
            if (criteria.status && u.status !== criteria.status)
                return false;
            if (criteria.role && u.role !== criteria.role)
                return false;
            return true;
        });
    }
};
exports.UserRepository = UserRepository;
exports.UserRepository = UserRepository = __decorate([
    (0, common_1.Injectable)()
], UserRepository);
//# sourceMappingURL=user.repository.js.map