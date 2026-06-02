export type CandidateStage = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED';
export type CandidateSource = 'CAREERS_PORTAL' | 'REFERRAL' | 'MANUAL';
export interface CandidateEntity {
    id: string;
    jobId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    currentDesignation: string;
    experienceYears: number;
    education: string;
    skills: string[];
    portfolioUrl?: string;
    coverLetter?: string;
    resumeUrl?: string;
    stage: CandidateStage;
    hasPortalAccess: boolean;
    source: CandidateSource;
    appliedAt: string;
    createdAt: string;
}
export declare class CandidatesRepository {
    private readonly store;
    create(dto: Omit<CandidateEntity, 'id' | 'createdAt'>): CandidateEntity;
    findById(id: string): CandidateEntity | null;
    findByEmailAndJobId(email: string, jobId: string): CandidateEntity | null;
    findByJobId(jobId: string): CandidateEntity[];
    updateById(id: string, updates: Partial<CandidateEntity>): CandidateEntity | null;
}
