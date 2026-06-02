import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

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

@Injectable()
export class JobsRepository {
  private readonly store = new Map<string, JobEntity>();

  create(dto: Omit<JobEntity, 'id' | 'createdAt' | 'updatedAt'>): JobEntity {
    const entity: JobEntity = {
      ...dto,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(entity.id, entity);
    return entity;
  }

  findById(id: string): JobEntity | null {
    return this.store.get(id) ?? null;
  }

  findAll(): JobEntity[] {
    return Array.from(this.store.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  findOpen(filters: JobsFilter): { jobs: JobEntity[]; total: number } {
    let jobs = Array.from(this.store.values()).filter((j) => j.status === 'OPEN');

    if (filters.search) {
      const q = filters.search.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.department.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q)),
      );
    }
    if (filters.department) jobs = jobs.filter((j) => j.department === filters.department);
    if (filters.employmentType) jobs = jobs.filter((j) => j.employmentType === filters.employmentType);
    if (filters.location)
      jobs = jobs.filter((j) => j.location.toLowerCase().includes(filters.location!.toLowerCase()));
    if (filters.experienceLevel) jobs = jobs.filter((j) => j.experienceLevel === filters.experienceLevel);

    jobs = jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = jobs.length;
    const limit = Math.min(filters.limit ?? 20, 50);
    const page = filters.page ?? 1;
    const offset = (page - 1) * limit;

    return { jobs: jobs.slice(offset, offset + limit), total };
  }

  incrementApplicantCount(id: string): void {
    const job = this.store.get(id);
    if (job) {
      this.store.set(id, { ...job, applicantCount: job.applicantCount + 1 });
    }
  }

  updateById(id: string, updates: Partial<JobEntity>): JobEntity | null {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}
