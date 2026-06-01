import { JobsRepository } from '../repositories/jobs.repository';
import { CandidatesRepository } from '../repositories/candidates.repository';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { ApplyJobDto } from './dto/apply-job.dto';
export declare class CareersService {
    private readonly jobsRepo;
    private readonly candidatesRepo;
    constructor(jobsRepo: JobsRepository, candidatesRepo: CandidatesRepository);
    listJobs(query: QueryJobsDto): {
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
    applyForJob(jobId: string, dto: ApplyJobDto, resumeUrl: string | undefined): {
        applicationId: string;
        candidateId: string;
        jobTitle: string;
        companyName: string;
        submittedAt: string;
        portalAccessGranted: boolean;
        confirmationEmail: string;
    };
}
