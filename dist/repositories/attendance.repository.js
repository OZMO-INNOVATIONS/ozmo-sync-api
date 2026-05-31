"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let AttendanceRepository = class AttendanceRepository {
    constructor() {
        this.store = new Map();
    }
    create(dto) {
        const record = {
            ...dto,
            id: (0, uuid_1.v4)(),
            createdAt: new Date().toISOString(),
        };
        this.store.set(record.id, record);
        return record;
    }
    findById(id) {
        return this.store.get(id) ?? null;
    }
    findOpenCheckIn(userId) {
        for (const record of this.store.values()) {
            if (record.userId === userId && record.checkOutTime === null)
                return record;
        }
        return null;
    }
    updateById(id, updates) {
        const existing = this.store.get(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...updates };
        this.store.set(id, updated);
        return updated;
    }
    findByUserId(userId) {
        return Array.from(this.store.values())
            .filter((r) => r.userId === userId)
            .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime));
    }
    findByUserIdInRange(userId, from, to) {
        return this.findByUserId(userId).filter((r) => {
            const t = new Date(r.checkInTime);
            return t >= from && t <= to;
        });
    }
    findAllInRange(from, to) {
        return Array.from(this.store.values()).filter((r) => {
            const t = new Date(r.checkInTime);
            return t >= from && t <= to;
        });
    }
};
exports.AttendanceRepository = AttendanceRepository;
exports.AttendanceRepository = AttendanceRepository = __decorate([
    (0, common_1.Injectable)()
], AttendanceRepository);
//# sourceMappingURL=attendance.repository.js.map