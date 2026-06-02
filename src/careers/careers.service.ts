import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JobsRepository } from '../repositories/jobs.repository';
import { CandidatesRepository } from '../repositories/candidates.repository';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { ApplyJobDto } from './dto/apply-job.dto';

@Injectable()
export class CareersService {
  constructor(
    private readonly jobsRepo: JobsRepository,
    private readonly candidatesRepo: CandidatesRepository,
  ) {}

  listJobs(query: QueryJobsDto) {
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

  applyForJob(jobId: string, dto: ApplyJobDto, resumeUrl: string | undefined) {
    const job = this.jobsRepo.findById(jobId);
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'OPEN') {
      throw new UnprocessableEntityException('This job is no longer accepting applications');
    }

    const existing = this.candidatesRepo.findByEmailAndJobId(dto.email, jobId);
    if (existing) {
      throw new ConflictException('You have already applied for this position');
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
}
