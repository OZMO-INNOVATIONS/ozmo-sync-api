"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareersModule = void 0;
const common_1 = require("@nestjs/common");
const careers_controller_1 = require("./careers.controller");
const careers_service_1 = require("./careers.service");
const jobs_repository_1 = require("../repositories/jobs.repository");
const candidates_repository_1 = require("../repositories/candidates.repository");
let CareersModule = class CareersModule {
};
exports.CareersModule = CareersModule;
exports.CareersModule = CareersModule = __decorate([
    (0, common_1.Module)({
        controllers: [careers_controller_1.CareersController],
        providers: [careers_service_1.CareersService, jobs_repository_1.JobsRepository, candidates_repository_1.CandidatesRepository],
        exports: [jobs_repository_1.JobsRepository, candidates_repository_1.CandidatesRepository],
    })
], CareersModule);
//# sourceMappingURL=careers.module.js.map