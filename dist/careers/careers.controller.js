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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const careers_service_1 = require("./careers.service");
const query_jobs_dto_1 = require("./dto/query-jobs.dto");
const apply_job_dto_1 = require("./dto/apply-job.dto");
const ALLOWED_RESUME_MIME = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
let CareersController = class CareersController {
    constructor(careersService) {
        this.careersService = careersService;
    }
    listJobs(query) {
        const data = this.careersService.listJobs(query);
        return { message: 'Job listings retrieved', data };
    }
    applyForJob(jobId, dto, resume) {
        const resumeUrl = resume
            ? `uploads/resumes/${Date.now()}_${resume.originalname}`
            : undefined;
        const data = this.careersService.applyForJob(jobId, dto, resumeUrl);
        return { message: 'Application submitted successfully', data };
    }
};
exports.CareersController = CareersController;
__decorate([
    (0, common_1.Get)('jobs'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_jobs_dto_1.QueryJobsDto]),
    __metadata("design:returntype", void 0)
], CareersController.prototype, "listJobs", null);
__decorate([
    (0, common_1.Post)('jobs/:jobId/apply'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('resume', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_, file, cb) => {
            if (ALLOWED_RESUME_MIME.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Resume must be a PDF, DOC, or DOCX file'), false);
            }
        },
    })),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, apply_job_dto_1.ApplyJobDto, Object]),
    __metadata("design:returntype", void 0)
], CareersController.prototype, "applyForJob", null);
exports.CareersController = CareersController = __decorate([
    (0, common_1.Controller)({ path: 'careers', version: '1' }),
    __metadata("design:paramtypes", [careers_service_1.CareersService])
], CareersController);
//# sourceMappingURL=careers.controller.js.map