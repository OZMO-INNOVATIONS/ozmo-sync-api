"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let JobsRepository = class JobsRepository {
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
    findById(id) {
        return this.store.get(id) ?? null;
    }
    findAll() {
        return Array.from(this.store.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    findOpen(filters) {
        let jobs = Array.from(this.store.values()).filter((j) => j.status === 'OPEN');
        if (filters.search) {
            const q = filters.search.toLowerCase();
            jobs = jobs.filter((j) => j.title.toLowerCase().includes(q) ||
                j.department.toLowerCase().includes(q) ||
                j.skills.some((s) => s.toLowerCase().includes(q)));
        }
        if (filters.department)
            jobs = jobs.filter((j) => j.department === filters.department);
        if (filters.employmentType)
            jobs = jobs.filter((j) => j.employmentType === filters.employmentType);
        if (filters.location)
            jobs = jobs.filter((j) => j.location.toLowerCase().includes(filters.location.toLowerCase()));
        if (filters.experienceLevel)
            jobs = jobs.filter((j) => j.experienceLevel === filters.experienceLevel);
        jobs = jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const total = jobs.length;
        const limit = Math.min(filters.limit ?? 20, 50);
        const page = filters.page ?? 1;
        const offset = (page - 1) * limit;
        return { jobs: jobs.slice(offset, offset + limit), total };
    }
    incrementApplicantCount(id) {
        const job = this.store.get(id);
        if (job) {
            this.store.set(id, { ...job, applicantCount: job.applicantCount + 1 });
        }
    }
    updateById(id, updates) {
        const existing = this.store.get(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        this.store.set(id, updated);
        return updated;
    }
};
exports.JobsRepository = JobsRepository;
exports.JobsRepository = JobsRepository = __decorate([
    (0, common_1.Injectable)()
], JobsRepository);
//# sourceMappingURL=jobs.repository.js.map