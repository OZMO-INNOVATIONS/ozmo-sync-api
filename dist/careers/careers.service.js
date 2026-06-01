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
exports.CareersService = void 0;
const common_1 = require("@nestjs/common");
const jobs_repository_1 = require("../repositories/jobs.repository");
const candidates_repository_1 = require("../repositories/candidates.repository");
let CareersService = class CareersService {
    constructor(jobsRepo, candidatesRepo) {
        this.jobsRepo = jobsRepo;
        this.candidatesRepo = candidatesRepo;
    }
    listJobs(query) {
        const { jobs, total } = this.jobsRepo.findOpen({
            search: query.search,
            department: query.department,
            employmentType: query.employmentType,
            location: query.location,
            experienceLevel: query.experienceLevel,
            page: query.page,
            limit: query.limit,
        });
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 50);
        return {
            jobs: jobs.map((j) => ({
                id: j.id,
                title: j.title,
                department: j.department,
                experienceLevel: j.experienceLevel,
                employmentType: j.employmentType,
                description: j.description,
                requirements: j.requirements,
                skills: j.skills,
                location: j.location,
                ...(j.hideSalaryPublicly
                    ? {}
                    : { salaryMin: j.salaryMin, salaryMax: j.salaryMax, currency: j.currency }),
                vacancies: j.vacancies,
                postedAt: j.createdAt,
                closingDate: j.closingDate ?? null,
                workspaceName: j.workspaceName,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    applyForJob(jobId, dto, resumeUrl) {
        const job = this.jobsRepo.findById(jobId);
        if (!job)
            throw new common_1.NotFoundException('Job not found');
        if (job.status !== 'OPEN') {
            throw new common_1.UnprocessableEntityException('This job is no longer accepting applications');
        }
        const existing = this.candidatesRepo.findByEmailAndJobId(dto.email, jobId);
        if (existing) {
            throw new common_1.ConflictException('You have already applied for this position');
        }
        const candidate = this.candidatesRepo.create({
            jobId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phone,
            currentDesignation: dto.currentDesignation,
            experienceYears: dto.experienceYears,
            education: dto.education,
            skills: dto.skills
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            portfolioUrl: dto.portfolioUrl,
            coverLetter: dto.coverLetter,
            resumeUrl,
            stage: 'APPLIED',
            hasPortalAccess: false,
            source: 'CAREERS_PORTAL',
            appliedAt: new Date().toISOString(),
        });
        this.jobsRepo.incrementApplicantCount(jobId);
        return {
            applicationId: candidate.id,
            candidateId: candidate.id,
            jobTitle: job.title,
            companyName: job.workspaceName,
            submittedAt: candidate.appliedAt,
            portalAccessGranted: false,
            confirmationEmail: `sent to ${dto.email}`,
        };
    }
};
exports.CareersService = CareersService;
exports.CareersService = CareersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jobs_repository_1.JobsRepository,
        candidates_repository_1.CandidatesRepository])
], CareersService);
//# sourceMappingURL=careers.service.js.map