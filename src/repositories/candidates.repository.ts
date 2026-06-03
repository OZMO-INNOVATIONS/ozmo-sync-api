import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CandidateStage as PrismaCandidateStage, CandidateSource as PrismaCandidateSource } from '@prisma/client';

export type CandidateStage =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED';

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

@Injectable()
export class CandidatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(cand: any): CandidateEntity {
    return {
      id: cand.id,
      jobId: cand.jobId,
      firstName: cand.firstName,
      lastName: cand.lastName,
      email: cand.email,
      phone: cand.phone,
      currentDesignation: cand.currentDesignation,
      experienceYears: cand.experienceYears,
      education: cand.education,
      skills: cand.skills,
      portfolioUrl: cand.portfolioUrl ?? undefined,
      coverLetter: cand.coverLetter ?? undefined,
      resumeUrl: cand.resumeUrl ?? undefined,
      stage: cand.stage as CandidateStage,
      hasPortalAccess: cand.hasPortalAccess,
      source: cand.source as CandidateSource,
      appliedAt: cand.appliedAt.toISOString(),
      createdAt: cand.createdAt.toISOString(),
    };
  }

  async create(dto: Omit<CandidateEntity, 'id' | 'createdAt'>): Promise<CandidateEntity> {
    const cand = await this.prisma.candidate.create({
      data: {
        jobId: dto.jobId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        currentDesignation: dto.currentDesignation,
        experienceYears: dto.experienceYears,
        education: dto.education,
        skills: dto.skills ?? [],
        portfolioUrl: dto.portfolioUrl,
        coverLetter: dto.coverLetter,
        resumeUrl: dto.resumeUrl,
        stage: dto.stage as PrismaCandidateStage,
        hasPortalAccess: dto.hasPortalAccess,
        source: dto.source as PrismaCandidateSource,
        appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : new Date(),
      },
    });
    return this.mapToEntity(cand);
  }

  async findById(id: string): Promise<CandidateEntity | null> {
    const cand = await this.prisma.candidate.findUnique({ where: { id } });
    return cand ? this.mapToEntity(cand) : null;
  }

  async findByEmailAndJobId(email: string, jobId: string): Promise<CandidateEntity | null> {
    const cand = await this.prisma.candidate.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        jobId,
      },
    });
    return cand ? this.mapToEntity(cand) : null;
  }

  async findByJobId(jobId: string): Promise<CandidateEntity[]> {
    const cands = await this.prisma.candidate.findMany({
      where: { jobId },
      orderBy: { appliedAt: 'desc' },
    });
    return cands.map((c) => this.mapToEntity(c));
  }

  async updateById(id: string, updates: Partial<CandidateEntity>): Promise<CandidateEntity | null> {
    try {
      const data: any = { ...updates };
      delete data.id;
      delete data.createdAt;
      if (updates.appliedAt !== undefined) data.appliedAt = updates.appliedAt ? new Date(updates.appliedAt) : null;
      if (updates.stage) data.stage = updates.stage as PrismaCandidateStage;
      if (updates.source) data.source = updates.source as PrismaCandidateSource;

      const cand = await this.prisma.candidate.update({
        where: { id },
        data,
      });
      return this.mapToEntity(cand);
    } catch (e) {
      console.error('Error in CandidatesRepository.updateById:', e);
      return null;
    }
  }
}
