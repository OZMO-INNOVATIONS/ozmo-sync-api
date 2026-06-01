"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidatesRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let CandidatesRepository = class CandidatesRepository {
    constructor() {
        this.store = new Map();
    }
    create(dto) {
        const entity = {
            ...dto,
            id: (0, uuid_1.v4)(),
            createdAt: new Date().toISOString(),
        };
        this.store.set(entity.id, entity);
        return entity;
    }
    findById(id) {
        return this.store.get(id) ?? null;
    }
    findByEmailAndJobId(email, jobId) {
        for (const c of this.store.values()) {
            if (c.email.toLowerCase() === email.toLowerCase() && c.jobId === jobId)
                return c;
        }
        return null;
    }
    findByJobId(jobId) {
        return Array.from(this.store.values())
            .filter((c) => c.jobId === jobId)
            .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
    }
    updateById(id, updates) {
        const existing = this.store.get(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...updates };
        this.store.set(id, updated);
        return updated;
    }
};
exports.CandidatesRepository = CandidatesRepository;
exports.CandidatesRepository = CandidatesRepository = __decorate([
    (0, common_1.Injectable)()
], CandidatesRepository);
//# sourceMappingURL=candidates.repository.js.map