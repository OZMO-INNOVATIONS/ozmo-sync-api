import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AttendanceSessionEntity {
  id: string;
  userId: string;
  workspaceId: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  durationMinutes: number | null;
  location: string | null;
  deviceInfo: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  verificationType?: string | null;
}

export interface AttendanceEntity {
  id: string;
  workspaceId: string;
  userId: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  breakMinutes: number;
  workedMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  status: string;
  createdAt: Date;
  verificationType?: string | null;
}

@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  private mapSessionToEntity(session: any): AttendanceSessionEntity {
    return {
      id: session.id,
      userId: session.userId,
      workspaceId: session.workspaceId,
      checkInTime: session.checkInTime,
      checkOutTime: session.checkOutTime,
      durationMinutes: session.durationMinutes,
      location: session.location,
      deviceInfo: session.deviceInfo,
      status: session.status,
      notes: session.notes,
      createdAt: session.createdAt,
      verificationType: session.verificationType,
    };
  }

  private mapAttendanceToEntity(record: any): AttendanceEntity {
    return {
      id: record.id,
      workspaceId: record.workspaceId,
      userId: record.userId,
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      breakMinutes: record.breakMinutes,
      workedMinutes: record.workedMinutes,
      overtimeMinutes: record.overtimeMinutes,
      lateMinutes: record.lateMinutes,
      status: record.status,
      createdAt: record.createdAt,
      verificationType: record.verificationType,
    };
  }

  async findOpenSession(userId: string, tx?: Prisma.TransactionClient): Promise<AttendanceSessionEntity | null> {
    const record = await this.getClient(tx).attendanceSession.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
    return record ? this.mapSessionToEntity(record) : null;
  }

  async createSession(
    dto: {
      userId: string;
      workspaceId: string;
      checkInTime: Date;
      notes?: string;
      location?: string;
      deviceInfo?: string;
      verificationType?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceSessionEntity> {
    const record = await this.getClient(tx).attendanceSession.create({
      data: {
        userId: dto.userId,
        workspaceId: dto.workspaceId,
        checkInTime: dto.checkInTime,
        notes: dto.notes,
        location: dto.location,
        deviceInfo: dto.deviceInfo,
        verificationType: dto.verificationType,
        status: 'ACTIVE',
      },
    });
    return this.mapSessionToEntity(record);
  }

  async updateSession(
    id: string,
    updates: {
      checkOutTime?: Date | null;
      durationMinutes?: number | null;
      status?: string;
      notes?: string;
      location?: string;
      deviceInfo?: string;
      verificationType?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceSessionEntity | null> {
    try {
      const record = await this.getClient(tx).attendanceSession.update({
        where: { id },
        data: updates,
      });
      return this.mapSessionToEntity(record);
    } catch (e) {
      console.error('Error in AttendanceRepository.updateSession:', e);
      return null;
    }
  }

  async findSessionById(id: string, tx?: Prisma.TransactionClient): Promise<AttendanceSessionEntity | null> {
    const record = await this.getClient(tx).attendanceSession.findFirst({
      where: { id, deletedAt: null },
    });
    return record ? this.mapSessionToEntity(record) : null;
  }

  async findSessionsByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<AttendanceSessionEntity[]> {
    const records = await this.getClient(tx).attendanceSession.findMany({
      where: { userId, deletedAt: null },
      orderBy: { checkInTime: 'desc' },
    });
    return records.map((r) => this.mapSessionToEntity(r));
  }

  async findSessionsByUserIdInRange(
    userId: string,
    from: Date,
    to: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceSessionEntity[]> {
    const records = await this.getClient(tx).attendanceSession.findMany({
      where: {
        userId,
        deletedAt: null,
        checkInTime: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { checkInTime: 'desc' },
    });
    return records.map((r) => this.mapSessionToEntity(r));
  }

  async findDailySummary(
    userId: string,
    date: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceEntity | null> {
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const record = await this.getClient(tx).attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
    });
    return record ? this.mapAttendanceToEntity(record) : null;
  }

  async upsertDailySummary(
    dto: {
      workspaceId: string;
      userId: string;
      date: Date;
      checkIn?: Date | null;
      checkOut?: Date | null;
      breakMinutes?: number;
      workedMinutes?: number;
      overtimeMinutes?: number;
      lateMinutes?: number;
      status?: string;
      verificationType?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceEntity> {
    const targetDate = new Date(dto.date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const data = {
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      breakMinutes: dto.breakMinutes ?? 0,
      workedMinutes: dto.workedMinutes ?? 0,
      overtimeMinutes: dto.overtimeMinutes ?? 0,
      lateMinutes: dto.lateMinutes ?? 0,
      status: dto.status ?? 'PRESENT',
      verificationType: dto.verificationType,
    };

    const record = await this.getClient(tx).attendance.upsert({
      where: {
        userId_date: {
          userId: dto.userId,
          date: targetDate,
        },
      },
      create: {
        workspaceId: dto.workspaceId,
        userId: dto.userId,
        date: targetDate,
        ...data,
      },
      update: data,
    });

    return this.mapAttendanceToEntity(record);
  }

  async findDailySummariesInRange(
    userId: string,
    from: Date,
    to: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceEntity[]> {
    const records = await this.getClient(tx).attendance.findMany({
      where: {
        userId,
        deletedAt: null,
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { date: 'desc' },
    });
    return records.map((r) => this.mapAttendanceToEntity(r));
  }

  async findAllDailySummariesInRange(
    from: Date,
    to: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceEntity[]> {
    const records = await this.getClient(tx).attendance.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { date: 'desc' },
    });
    return records.map((r) => this.mapAttendanceToEntity(r));
  }

  async findAllSessionsInRange(
    from: Date,
    to: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceSessionEntity[]> {
    const records = await this.getClient(tx).attendanceSession.findMany({
      where: {
        deletedAt: null,
        checkInTime: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { checkInTime: 'desc' },
    });
    return records.map((r) => this.mapSessionToEntity(r));
  }

  async findAll(tx?: Prisma.TransactionClient): Promise<AttendanceSessionEntity[]> {
    const records = await this.getClient(tx).attendanceSession.findMany({
      where: { deletedAt: null },
      orderBy: { checkInTime: 'desc' },
    });
    return records.map((r) => this.mapSessionToEntity(r));
  }
}
