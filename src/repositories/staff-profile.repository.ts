import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StaffProfileEntity {
  id: string;
  userId: string;
  emergencyContact?: string;
  address?: string;
  skills?: string[];
  bio?: string;
  updatedAt: string;
}

@Injectable()
export class StaffProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(profile: any): StaffProfileEntity {
    return {
      id: profile.id,
      userId: profile.userId,
      emergencyContact: profile.emergencyContact ?? undefined,
      address: profile.address ?? undefined,
      skills: profile.skills,
      bio: profile.bio ?? undefined,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  async create(dto: Omit<StaffProfileEntity, 'id' | 'updatedAt'>): Promise<StaffProfileEntity> {
    const profile = await this.prisma.staffProfile.create({
      data: {
        userId: dto.userId,
        emergencyContact: dto.emergencyContact,
        address: dto.address,
        skills: dto.skills ?? [],
        bio: dto.bio,
      },
    });
    return this.mapToEntity(profile);
  }

  async findByUserId(userId: string): Promise<StaffProfileEntity | null> {
    const profile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });
    return profile ? this.mapToEntity(profile) : null;
  }

  async updateByUserId(
    userId: string,
    updates: Partial<StaffProfileEntity>,
  ): Promise<StaffProfileEntity | null> {
    try {
      const data: any = { ...updates };
      delete data.id;
      delete data.userId;
      delete data.updatedAt;

      const profile = await this.prisma.staffProfile.update({
        where: { userId },
        data,
      });
      return this.mapToEntity(profile);
    } catch (e) {
      console.error('Error in StaffProfileRepository.updateByUserId:', e);
      return null;
    }
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      await this.prisma.staffProfile.delete({ where: { userId } });
      return true;
    } catch (e) {
      console.error('Error in StaffProfileRepository.deleteByUserId:', e);
      return false;
    }
  }
}
