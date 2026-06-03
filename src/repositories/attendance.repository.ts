import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AttendanceRecord {
  id: string;
  userId: string;
  checkInTime: string;
  checkOutTime: string | null;
  notes?: string;
  createdAt: string;
}

@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(record: any): AttendanceRecord {
    return {
      id: record.id,
      userId: record.userId,
      checkInTime: record.checkInTime.toISOString(),
      checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
      notes: record.notes ?? undefined,
      createdAt: record.createdAt.toISOString(),
    };
  }

  async create(dto: Omit<AttendanceRecord, 'id' | 'createdAt'>): Promise<AttendanceRecord> {
    const record = await this.prisma.attendanceRecord.create({
      data: {
        userId: dto.userId,
        checkInTime: new Date(dto.checkInTime),
        checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
        notes: dto.notes,
      },
    });
    return this.mapToEntity(record);
  }

  async findById(id: string): Promise<AttendanceRecord | null> {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
    });
    return record ? this.mapToEntity(record) : null;
  }

  async findOpenCheckIn(userId: string): Promise<AttendanceRecord | null> {
    const record = await this.prisma.attendanceRecord.findFirst({
      where: {
        userId,
        checkOutTime: null,
      },
    });
    return record ? this.mapToEntity(record) : null;
  }

  async updateById(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | null> {
    try {
      const data: any = {};
      if (updates.checkInTime !== undefined) data.checkInTime = new Date(updates.checkInTime);
      if (updates.checkOutTime !== undefined) data.checkOutTime = updates.checkOutTime ? new Date(updates.checkOutTime) : null;
      if (updates.notes !== undefined) data.notes = updates.notes;

      const record = await this.prisma.attendanceRecord.update({
        where: { id },
        data,
      });
      return this.mapToEntity(record);
    } catch (e) {
      console.error('Error in AttendanceRepository.updateById:', e);
      return null;
    }
  }

  async findByUserId(userId: string): Promise<AttendanceRecord[]> {
    const records = await this.prisma.attendanceRecord.findMany({
      where: { userId },
      orderBy: { checkInTime: 'desc' },
    });
    return records.map((r) => this.mapToEntity(r));
  }

  async findByUserIdInRange(userId: string, from: Date, to: Date): Promise<AttendanceRecord[]> {
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        userId,
        checkInTime: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { checkInTime: 'desc' },
    });
    return records.map((r) => this.mapToEntity(r));
  }

  async findAllInRange(from: Date, to: Date): Promise<AttendanceRecord[]> {
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        checkInTime: {
          gte: from,
          lte: to,
        },
      },
    });
    return records.map((r) => this.mapToEntity(r));
  }
}
