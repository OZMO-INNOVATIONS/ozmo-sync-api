import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

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
  private readonly store = new Map<string, CandidateEntity>();

  create(dto: Omit<CandidateEntity, 'id' | 'createdAt'>): CandidateEntity {
    const entity: CandidateEntity = {
      ...dto,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    this.store.set(entity.id, entity);
    return entity;
  }

  findById(id: string): CandidateEntity | null {
    return this.store.get(id) ?? null;
  }

  findByEmailAndJobId(email: string, jobId: string): CandidateEntity | null {
    for (const c of this.store.values()) {
      if (c.email.toLowerCase() === email.toLowerCase() && c.jobId === jobId) return c;
    }
    return null;
  }

  findByJobId(jobId: string): CandidateEntity[] {
    return Array.from(this.store.values())
      .filter((c) => c.jobId === jobId)
      .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  }

  updateById(id: string, updates: Partial<CandidateEntity>): CandidateEntity | null {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.store.set(id, updated);
    return updated;
  }
}
