import { CareersService } from './careers.service';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { ApplyJobDto } from './dto/apply-job.dto';
interface UploadedFileInfo {
    fieldname: string;
    originalname: string;
    mimetype: string;
    size: number;
    buffer?: Buffer;
}
export declare class CareersController {
    private readonly careersService;
    constructor(careersService: CareersService);
    listJobs(query: QueryJobsDto): {
        message: string;
        data: {
            jobs: {
                vacancies: number;
                postedAt: string;
                closingDate: string | null;
                workspaceName: string;
                salaryMin?: number | undefined;
                salaryMax?: number | undefined;
                currency?: string | undefined;
                id: string;
                title: string;
                department: string;
                experienceLevel: import("../repositories/jobs.repository").ExperienceLevel;
                employmentType: import("../repositories/jobs.repository").EmploymentType;
                description: string;
                requirements: string[];
                skills: string[];
                location: string;
            }[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
    applyForJob(jobId: string, dto: ApplyJobDto, resume?: UploadedFileInfo): {
        message: string;
        data: {
            applicationId: string;
            candidateId: string;
            jobTitle: string;
            companyName: string;
            submittedAt: string;
            portalAccessGranted: boolean;
            confirmationEmail: string;
        };
    };
}
export {};
