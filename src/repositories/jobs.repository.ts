import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  JobStatus as PrismaJobStatus,
  ExperienceLevel as PrismaExperienceLevel,
  EmploymentType as PrismaEmploymentType,
} from '@prisma/client';

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
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(job: any): JobEntity {
    return {
      id: job.id,
      title: job.title,
      department: job.department,
      experienceLevel: job.experienceLevel as ExperienceLevel,
      employmentType: job.employmentType as EmploymentType,
      description: job.description,
      requirements: job.requirements,
      skills: job.skills,
      location: job.location,
      salaryMin: job.salaryMin ?? undefined,
      salaryMax: job.salaryMax ?? undefined,
      currency: job.currency,
      vacancies: job.vacancies,
      status: job.status as JobStatus,
      workspaceId: job.workspaceId,
      workspaceName: job.workspaceName,
      hideSalaryPublicly: job.hideSalaryPublicly,
      applicantCount: job.applicantCount,
      closingDate: job.closingDate ? job.closingDate.toISOString().split('T')[0] : undefined,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  async create(dto: Omit<JobEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobEntity> {
    const job = await this.prisma.job.create({
      data: {
        title: dto.title,
        department: dto.department,
        experienceLevel: dto.experienceLevel as PrismaExperienceLevel,
        employmentType: dto.employmentType as PrismaEmploymentType,
        description: dto.description,
        requirements: dto.requirements ?? [],
        skills: dto.skills ?? [],
        location: dto.location,
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
        currency: dto.currency,
        vacancies: dto.vacancies,
        status: dto.status as PrismaJobStatus,
        workspaceId: dto.workspaceId,
        workspaceName: dto.workspaceName,
        hideSalaryPublicly: dto.hideSalaryPublicly,
        applicantCount: dto.applicantCount,
        closingDate: dto.closingDate ? new Date(dto.closingDate) : null,
      },
    });
    return this.mapToEntity(job);
  }

  async findById(id: string): Promise<JobEntity | null> {
    const job = await this.prisma.job.findUnique({ where: { id } });
    return job ? this.mapToEntity(job) : null;
  }

  async findAll(): Promise<JobEntity[]> {
    const jobs = await this.prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return jobs.map((j) => this.mapToEntity(j));
  }

  async findOpen(filters: JobsFilter): Promise<{ jobs: JobEntity[]; total: number }> {
    const where: any = { status: PrismaJobStatus.OPEN };

    if (filters.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (filters.department) where.department = filters.department;
    if (filters.employmentType) where.employmentType = filters.employmentType as PrismaEmploymentType;
    if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters.experienceLevel) where.experienceLevel = filters.experienceLevel as PrismaExperienceLevel;

    const total = await this.prisma.job.count({ where });

    const limit = Math.min(filters.limit ?? 20, 50);
    const page = filters.page ?? 1;
    const offset = (page - 1) * limit;

    const jobs = await this.prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return {
      jobs: jobs.map((j) => this.mapToEntity(j)),
      total,
    };
  }

  async incrementApplicantCount(id: string): Promise<void> {
    await this.prisma.job.update({
      where: { id },
      data: {
        applicantCount: { increment: 1 },
      },
    });
  }

  async updateById(id: string, updates: Partial<JobEntity>): Promise<JobEntity | null> {
    try {
      const data: any = { ...updates };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;

      if (updates.experienceLevel) data.experienceLevel = updates.experienceLevel as PrismaExperienceLevel;
      if (updates.employmentType) data.employmentType = updates.employmentType as PrismaEmploymentType;
      if (updates.status) data.status = updates.status as PrismaJobStatus;
      if (updates.closingDate !== undefined) data.closingDate = updates.closingDate ? new Date(updates.closingDate) : null;

      const job = await this.prisma.job.update({
        where: { id },
        data,
      });
      return this.mapToEntity(job);
    } catch (e) {
      console.error('Error in JobsRepository.updateById:', e);
      return null;
    }
  }
}
