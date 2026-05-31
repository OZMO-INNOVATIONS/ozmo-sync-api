"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffProfileRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let StaffProfileRepository = class StaffProfileRepository {
    constructor() {
        this.store = new Map();
    }
    create(dto) {
        const profile = {
            ...dto,
            id: (0, uuid_1.v4)(),
            updatedAt: new Date().toISOString(),
        };
        this.store.set(profile.userId, profile);
        return profile;
    }
    findByUserId(userId) {
        return this.store.get(userId) ?? null;
    }
    updateByUserId(userId, updates) {
        const existing = this.store.get(userId);
        if (!existing)
            return null;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        this.store.set(userId, updated);
        return updated;
    }
    deleteByUserId(userId) {
        return this.store.delete(userId);
    }
};
exports.StaffProfileRepository = StaffProfileRepository;
exports.StaffProfileRepository = StaffProfileRepository = __decorate([
    (0, common_1.Injectable)()
], StaffProfileRepository);
//# sourceMappingURL=staff-profile.repository.js.map