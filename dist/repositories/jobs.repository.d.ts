export type JobStatus = 'OPEN' | 'PAUSED' | 'CLOSED';
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export interface JobEntity {
    id: string;
    title: string;
    department: string;
    experienceLevel: ExperienceLevel;
    employmentType: EmploymentType;
    description: string;
    requirements: string[];
    skills: string[];
    location: string;
    salaryMin?: number;
    salaryMax?: number;
    currency: string;
    vacancies: number;
    status: JobStatus;
    workspaceId: string;
    workspaceName: string;
    hideSalaryPublicly: boolean;
    applicantCount: number;
    closingDate?: string;
    createdAt: string;
    updatedAt: string;
}
export interface JobsFilter {
    search?: string;
    department?: string;
    employmentType?: string;
    location?: string;
    experienceLevel?: string;
    page?: number;
    limit?: number;
}
export declare class JobsRepository {
    private readonly store;
    create(dto: Omit<JobEntity, 'id' | 'createdAt' | 'updatedAt'>): JobEntity;
    findById(id: string): JobEntity | null;
    findAll(): JobEntity[];
    findOpen(filters: JobsFilter): {
        jobs: JobEntity[];
        total: number;
    };
    incrementApplicantCount(id: string): void;
    updateById(id: string, updates: Partial<JobEntity>): JobEntity | null;
}
