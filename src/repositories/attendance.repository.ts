import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { formatDate, formatDateTime } from '../common/utils/date-format.util';

export interface AttendanceSessionEntity {
  id: string;
  userId: string;
  workspaceId: string;
  checkInTime: string;
  checkOutTime: string | null;
  durationMinutes: number | null;
  location: string | null;
  deviceInfo: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

export interface AttendanceDailySummaryEntity {
  id: string;
  userId: string;
  date: string;
  firstCheckIn: string | null;
  lastCheckOut: string | null;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  totalSessions: number;
  attendanceStatus: string;
  createdAt: string;
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
      checkInTime: formatDateTime(session.checkInTime) ?? session.checkInTime.toISOString(),
      checkOutTime: session.checkOutTime ? (formatDateTime(session.checkOutTime) ?? null) : null,
      durationMinutes: session.durationMinutes,
      location: session.location,
      deviceInfo: session.deviceInfo,
      status: session.status,
      notes: session.notes,
      createdAt: formatDateTime(session.createdAt) ?? session.createdAt.toISOString(),
    };
  }

  private mapSummaryToEntity(summary: any): AttendanceDailySummaryEntity {
    return {
      id: summary.id,
      userId: summary.userId,
      date: formatDate(summary.date) ?? summary.date.toISOString(),
      firstCheckIn: summary.firstCheckIn ? (formatDateTime(summary.firstCheckIn) ?? null) : null,
      lastCheckOut: summary.lastCheckOut ? (formatDateTime(summary.lastCheckOut) ?? null) : null,
      totalWorkMinutes: summary.totalWorkMinutes,
      totalBreakMinutes: summary.totalBreakMinutes,
      totalSessions: summary.totalSessions,
      attendanceStatus: summary.attendanceStatus,
      createdAt: formatDateTime(summary.createdAt) ?? summary.createdAt.toISOString(),
    };
  }

  async findOpenSession(userId: string, tx?: Prisma.TransactionClient): Promise<AttendanceSessionEntity | null> {
    const record = await this.getClient(tx).attendanceSession.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
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
    const record = await this.getClient(tx).attendanceSession.findUnique({
      where: { id },
    });
    return record ? this.mapSessionToEntity(record) : null;
  }

  async findRawSessionById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ checkInTime: Date; checkOutTime: Date | null } | null> {
    const record = await this.getClient(tx).attendanceSession.findUnique({
      where: { id },
    });
    if (!record) return null;
    return {
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
    };
  }

  async findSessionsByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<AttendanceSessionEntity[]> {
    const records = await this.getClient(tx).attendanceSession.findMany({
      where: { userId },
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
        checkInTime: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { checkInTime: 'desc' },
    });
    return records.map((r) => this.mapSessionToEntity(r));
  }

  async findSessionsByUserIdAndDate(
    userId: string,
    date: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceSessionEntity[]> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const records = await this.getClient(tx).attendanceSession.findMany({
      where: {
        userId,
        checkInTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { checkInTime: 'asc' },
    });
    return records.map((r) => this.mapSessionToEntity(r));
  }

  async findDailySummary(
    userId: string,
    date: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceDailySummaryEntity | null> {
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const summary = await this.getClient(tx).attendanceDailySummary.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
    });
    return summary ? this.mapSummaryToEntity(summary) : null;
  }

  async findRawDailySummary(
    userId: string,
    date: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<any | null> {
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    return await this.getClient(tx).attendanceDailySummary.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
    });
  }

  async upsertDailySummary(
    dto: {
      userId: string;
      date: Date;
      firstCheckIn?: Date | null;
      lastCheckOut?: Date | null;
      totalWorkMinutes?: number;
      totalBreakMinutes?: number;
      totalSessions?: number;
      attendanceStatus?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceDailySummaryEntity> {
    const targetDate = new Date(dto.date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const data = {
      firstCheckIn: dto.firstCheckIn,
      lastCheckOut: dto.lastCheckOut,
      totalWorkMinutes: dto.totalWorkMinutes ?? 0,
      totalBreakMinutes: dto.totalBreakMinutes ?? 0,
      totalSessions: dto.totalSessions ?? 0,
      attendanceStatus: dto.attendanceStatus ?? 'PRESENT',
    };

    const summary = await this.getClient(tx).attendanceDailySummary.upsert({
      where: {
        userId_date: {
          userId: dto.userId,
          date: targetDate,
        },
      },
      create: {
        userId: dto.userId,
        date: targetDate,
        ...data,
      },
      update: data,
    });

    return this.mapSummaryToEntity(summary);
  }

  async findDailySummariesInRange(
    userId: string,
    from: Date,
    to: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceDailySummaryEntity[]> {
    const summaries = await this.getClient(tx).attendanceDailySummary.findMany({
      where: {
        userId,
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { date: 'desc' },
    });
    return summaries.map((s) => this.mapSummaryToEntity(s));
  }

  async findAllDailySummariesInRange(
    from: Date,
    to: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceDailySummaryEntity[]> {
    const summaries = await this.getClient(tx).attendanceDailySummary.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { date: 'desc' },
    });
    return summaries.map((s) => this.mapSummaryToEntity(s));
  }

  async findRawSessionsInRange(
    from: Date,
    to: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<{ userId: string; checkInTime: Date; checkOutTime: Date | null; status: string }[]> {
    const records = await this.getClient(tx).attendanceSession.findMany({
      where: {
        checkInTime: {
          gte: from,
          lte: to,
        },
      },
    });
    return records.map((r) => ({
      userId: r.userId,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      status: r.status,
    }));
  }

  async findAllSessionsInRange(
    from: Date,
    to: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<AttendanceSessionEntity[]> {
    const records = await this.getClient(tx).attendanceSession.findMany({
      where: {
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
      orderBy: { checkInTime: 'desc' },
    });
    return records.map((r) => this.mapSessionToEntity(r));
  }
}
