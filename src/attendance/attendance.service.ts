import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { UserRepository } from '../repositories/user.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { formatDate, formatDateTime, formatTime, formatDuration, formatSummaryDuration } from '../common/utils/date-format.util';

function calculateAttendanceStatus(firstCheckIn: Date | null, totalWorkMinutes: number): string {
  if (!firstCheckIn) return 'ABSENT';

  // Check late threshold (09:30 AM UTC)
  const h = firstCheckIn.getUTCHours();
  const m = firstCheckIn.getUTCMinutes();
  const isLate = h > 9 || (h === 9 && m > 30);

  if (totalWorkMinutes >= 480) {
    return isLate ? 'LATE' : 'PRESENT';
  } else if (totalWorkMinutes >= 240) {
    return 'HALF_DAY';
  } else {
    // If they checked in but haven't worked 4 hours yet (or still active)
    return isLate ? 'LATE' : 'PRESENT';
  }
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly userRepo: UserRepository,
    private readonly prisma: PrismaService,
  ) {}

  private _formatDailySummaryResponse(sessions: any[], summary?: any) {
    const formatTimeFromValue = (val: any) => {
      if (!val) return null;
      if (val instanceof Date) return formatTime(val);
      if (typeof val === 'string') {
        if (val.includes(', ')) {
          return val.split(', ')[1];
        }
        return formatTime(new Date(val));
      }
      return null;
    };

    const firstCheckIn = formatTimeFromValue(summary?.firstCheckIn);
    const lastCheckOut = formatTimeFromValue(summary?.lastCheckOut);
    const totalWorkMinutes = summary?.totalWorkMinutes ?? 0;
    const totalBreakMinutes = summary?.totalBreakMinutes ?? 0;

    return {
      firstCheckIn,
      lastCheckOut,
      totalWorkedHours: formatSummaryDuration(totalWorkMinutes),
      totalBreakHours: formatSummaryDuration(totalBreakMinutes),
      sessions: sessions.map((s) => ({
        checkIn: formatTimeFromValue(s.checkInTime) ?? '',
        checkOut: s.checkOutTime ? (formatTimeFromValue(s.checkOutTime) ?? null) : null,
        duration: s.durationMinutes !== null ? formatDuration(s.durationMinutes) : '0m',
        location: s.location ?? undefined,
        deviceInfo: s.deviceInfo ?? undefined,
        status: s.status,
      })),
    };
  }

  async checkIn(userId: string, dto: CheckInDto) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const checkInTime = dto.checkInTime ? new Date(dto.checkInTime) : new Date();
    const dateOnly = new Date(Date.UTC(checkInTime.getUTCFullYear(), checkInTime.getUTCMonth(), checkInTime.getUTCDate()));

    return await this.prisma.$transaction(async (tx) => {
      // Prevent duplicate Check-In without Check-Out
      const open = await this.attendanceRepo.findOpenSession(userId, tx);
      if (open) {
        throw new ConflictException('You are already checked in. Please check out first.');
      }

      // Create new session
      await this.attendanceRepo.createSession(
        {
          userId,
          workspaceId: user.workspaceId,
          checkInTime,
          notes: dto.notes,
          location: dto.location,
          deviceInfo: dto.deviceInfo,
        },
        tx,
      );

      // Fetch all sessions for today
      const rawSessions = await tx.attendanceSession.findMany({
        where: {
          userId,
          checkInTime: {
            gte: new Date(dateOnly.getTime()),
            lte: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000 - 1),
          },
        },
        orderBy: { checkInTime: 'asc' },
      });

      // Recalculate daily summary
      const firstCheckIn = rawSessions[0].checkInTime;
      const lastCheckOut = null; // Still active

      // Calculate break time so far
      let totalBreakMinutes = 0;
      for (let i = 1; i < rawSessions.length; i++) {
        const prev = rawSessions[i - 1];
        const curr = rawSessions[i];
        if (prev.checkOutTime) {
          const gapMs = curr.checkInTime.getTime() - prev.checkOutTime.getTime();
          if (gapMs > 0) {
            totalBreakMinutes += Math.round(gapMs / 60000);
          }
        }
      }

      const totalWorkMinutes = rawSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
      const status = calculateAttendanceStatus(firstCheckIn, totalWorkMinutes);

      const summary = await this.attendanceRepo.upsertDailySummary(
        {
          userId,
          date: dateOnly,
          firstCheckIn,
          lastCheckOut,
          totalWorkMinutes,
          totalBreakMinutes,
          totalSessions: rawSessions.length,
          attendanceStatus: status,
        },
        tx,
      );

      return this._formatDailySummaryResponse(rawSessions, summary);
    });
  }

  async checkOut(userId: string, dto: CheckOutDto) {
    const checkOutTime = dto.checkOutTime ? new Date(dto.checkOutTime) : new Date();

    return await this.prisma.$transaction(async (tx) => {
      const open = await this.attendanceRepo.findOpenSession(userId, tx);
      if (!open) {
        throw new NotFoundException('No active check-in found');
      }

      const checkInTime = new Date(open.checkInTime.includes(', ') ? `${open.checkInTime.split(', ')[0]} ${open.checkInTime.split(', ')[1]}` : open.checkInTime);
      const durationMinutes = Math.max(0, Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000));

      // Update active session
      await this.attendanceRepo.updateSession(
        open.id,
        {
          checkOutTime,
          durationMinutes,
          status: 'COMPLETED',
          notes: dto.notes,
          location: dto.location,
          deviceInfo: dto.deviceInfo,
        },
        tx,
      );

      // Get date of the check-in session (UTC)
      const dateOnly = new Date(Date.UTC(checkInTime.getUTCFullYear(), checkInTime.getUTCMonth(), checkInTime.getUTCDate()));

      // Fetch all sessions for today
      const rawSessions = await tx.attendanceSession.findMany({
        where: {
          userId,
          checkInTime: {
            gte: new Date(dateOnly.getTime()),
            lte: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000 - 1),
          },
        },
        orderBy: { checkInTime: 'asc' },
      });

      // Recalculate daily summary
      const firstCheckIn = rawSessions[0].checkInTime;
      const completedSessions = rawSessions.filter((s) => s.checkOutTime !== null);
      const lastCheckOut = completedSessions.length > 0
        ? new Date(Math.max(...completedSessions.map((s) => s.checkOutTime!.getTime())))
        : null;

      // Calculate break time
      let totalBreakMinutes = 0;
      for (let i = 1; i < rawSessions.length; i++) {
        const prev = rawSessions[i - 1];
        const curr = rawSessions[i];
        if (prev.checkOutTime) {
          const gapMs = curr.checkInTime.getTime() - prev.checkOutTime.getTime();
          if (gapMs > 0) {
            totalBreakMinutes += Math.round(gapMs / 60000);
          }
        }
      }

      const totalWorkMinutes = rawSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
      const status = calculateAttendanceStatus(firstCheckIn, totalWorkMinutes);

      const summary = await this.attendanceRepo.upsertDailySummary(
        {
          userId,
          date: dateOnly,
          firstCheckIn,
          lastCheckOut,
          totalWorkMinutes,
          totalBreakMinutes,
          totalSessions: rawSessions.length,
          attendanceStatus: status,
        },
        tx,
      );

      return this._formatDailySummaryResponse(rawSessions, summary);
    });
  }

  async getTodayAttendance(userId: string) {
    const now = new Date();
    const dateOnly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const sessions = await this.attendanceRepo.findSessionsByUserIdAndDate(userId, dateOnly);
    const summary = await this.attendanceRepo.findDailySummary(userId, dateOnly);

    if (sessions.length === 0) {
      return {
        firstCheckIn: null,
        lastCheckOut: null,
        totalWorkedHours: '0h 0m',
        totalBreakHours: '0h 0m',
        sessions: [],
      };
    }

    return this._formatDailySummaryResponse(sessions, summary);
  }

  async getAttendanceHistory(userId: string, query: AttendanceQueryDto) {
    const { from, to } = this._resolveRange(query);

    // Fetch summaries in range
    const summaries = await this.attendanceRepo.findDailySummariesInRange(userId, from, to);

    // Fetch sessions in range
    const sessions = await this.attendanceRepo.findSessionsByUserIdInRange(userId, from, to);

    // Group sessions by UTC date string in "DD Mon YYYY" format
    const sessionsByDate = new Map<string, any[]>();
    for (const s of sessions) {
      const datePart = s.checkInTime.split(', ')[0]; // "06 Jun 2026"
      if (!sessionsByDate.has(datePart)) {
        sessionsByDate.set(datePart, []);
      }
      sessionsByDate.get(datePart)!.push(s);
    }

    return summaries.map((sum) => {
      const datePart = sum.date; // "06 Jun 2026"
      const dateSessions = sessionsByDate.get(datePart) ?? [];

      return {
        date: sum.date,
        ...this._formatDailySummaryResponse(dateSessions, sum),
        attendanceStatus: sum.attendanceStatus,
        totalSessions: sum.totalSessions,
      };
    });
  }

  async getAttendanceSummary(userId: string, query: AttendanceQueryDto) {
    const { from, to } = this._resolveRange(query);

    // Fetch summaries in range
    const summaries = await this.attendanceRepo.findDailySummariesInRange(userId, from, to);

    // Get today's hours
    const today = new Date();
    const todayDateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const todaySummary = summaries.find((s) => {
      const d = new Date(s.date);
      return d.getUTCDate() === todayDateOnly.getUTCDate() &&
             d.getUTCMonth() === todayDateOnly.getUTCMonth() &&
             d.getUTCFullYear() === todayDateOnly.getUTCFullYear();
    });
    const dailyHours = todaySummary ? formatSummaryDuration(todaySummary.totalWorkMinutes) : '0h 0m';

    // Calculate weekly hours
    const startOfWeek = this._startOfCurrentWeek();
    const weeklySummaries = summaries.filter((s) => new Date(s.date) >= startOfWeek);
    const weeklyMinutes = weeklySummaries.reduce((sum, s) => sum + s.totalWorkMinutes, 0);
    const weeklyHours = formatSummaryDuration(weeklyMinutes);

    // Calculate monthly hours
    const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const monthlySummaries = summaries.filter((s) => new Date(s.date) >= startOfMonth);
    const monthlyMinutes = monthlySummaries.reduce((sum, s) => sum + s.totalWorkMinutes, 0);
    const monthlyHours = formatSummaryDuration(monthlyMinutes);

    // Calculate present days in query range
    const presentDays = summaries.filter((s) => s.totalWorkMinutes > 0).length;

    // Calculate total working days in range (Monday to Friday)
    let totalWorkingDays = 0;
    const cur = new Date(from);
    while (cur <= to) {
      const day = cur.getUTCDay();
      if (day !== 0 && day !== 6) {
        totalWorkingDays++;
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const attendancePercentage = totalWorkingDays > 0
      ? Math.round((presentDays / totalWorkingDays) * 1000) / 10
      : 0;

    // Calculate late check-ins
    const lateCheckIns = summaries.filter((s) => s.attendanceStatus === 'LATE').length;

    // Calculate overtime (minutes worked > 480 per day)
    let totalOvertimeMinutes = 0;
    for (const s of summaries) {
      if (s.totalWorkMinutes > 480) {
        totalOvertimeMinutes += (s.totalWorkMinutes - 480);
      }
    }
    const overtime = formatSummaryDuration(totalOvertimeMinutes);

    // Calculate average working hours
    const totalMinutes = summaries.reduce((sum, s) => sum + s.totalWorkMinutes, 0);
    const avgMinutes = presentDays > 0 ? Math.round(totalMinutes / presentDays) : 0;
    const averageWorkingHours = formatSummaryDuration(avgMinutes);

    return {
      dailyHours,
      weeklyHours,
      monthlyHours,
      attendancePercentage,
      lateCheckIns,
      overtime,
      averageWorkingHours,
    };
  }

  async getMonthlyReport(userId: string, query: AttendanceQueryDto) {
    const today = new Date();
    let year = today.getUTCFullYear();
    let month = today.getUTCMonth() + 1;

    if (query.month) {
      const parts = query.month.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    }

    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const summaries = await this.attendanceRepo.findDailySummariesInRange(userId, from, to);
    const sessions = await this.attendanceRepo.findSessionsByUserIdInRange(userId, from, to);

    // Group sessions by date
    const sessionsByDate = new Map<string, any[]>();
    for (const s of sessions) {
      const datePart = s.checkInTime.split(', ')[0];
      if (!sessionsByDate.has(datePart)) {
        sessionsByDate.set(datePart, []);
      }
      sessionsByDate.get(datePart)!.push(s);
    }

    const report: any[] = [];
    const cur = new Date(from);
    while (cur <= to) {
      const formattedDate = formatDate(cur)!;
      const daySummary = summaries.find((s) => s.date === formattedDate);

      if (daySummary) {
        const dateSessions = sessionsByDate.get(formattedDate) ?? [];
        report.push({
          date: formattedDate,
          ...this._formatDailySummaryResponse(dateSessions, daySummary),
          attendanceStatus: daySummary.attendanceStatus,
          totalSessions: daySummary.totalSessions,
        });
      } else {
        const dayOfWeek = cur.getUTCDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        report.push({
          date: formattedDate,
          firstCheckIn: null,
          lastCheckOut: null,
          totalWorkedHours: '0h 0m',
          totalBreakHours: '0h 0m',
          sessions: [],
          attendanceStatus: isWeekend ? 'WEEKEND' : 'ABSENT',
          totalSessions: 0,
        });
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    return report;
  }

  async getDashboard(query: AttendanceQueryDto) {
    const { from, to } = this._resolveRange(query);
    const summaries = await this.attendanceRepo.findAllDailySummariesInRange(from, to);
    const rawSessions = await this.attendanceRepo.findRawSessionsInRange(from, to);

    const checkedIn = new Set(summaries.map((s) => s.userId));
    const completedRaw = rawSessions.filter((s) => s.status === 'COMPLETED');

    const totalDurationMinutes = completedRaw.reduce((sum, s) => {
      if (!s.checkOutTime) return sum;
      return sum + Math.round((s.checkOutTime.getTime() - s.checkInTime.getTime()) / 60000);
    }, 0);

    return {
      period: {
        from: formatDateTime(from) ?? from.toISOString(),
        to: formatDateTime(to) ?? to.toISOString(),
      },
      totalPresent: checkedIn.size,
      totalSessions: rawSessions.length,
      completedSessions: completedRaw.length,
      totalDurationMinutes,
      totalDuration: formatDuration(totalDurationMinutes),
    };
  }

  private _resolveRange(query: AttendanceQueryDto): { from: Date; to: Date } {
    const now = new Date();

    if (query.date) {
      const from = new Date(`${query.date}T00:00:00.000Z`);
      const to = new Date(`${query.date}T23:59:59.999Z`);
      return { from, to };
    }

    if (query.month) {
      const [year, month] = query.month.split('-').map(Number);
      const from = new Date(Date.UTC(year, month - 1, 1));
      const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      return { from, to };
    }

    if (query.week) {
      const [year, weekStr] = query.week.split('-W');
      const week = parseInt(weekStr, 10);
      const from = this._isoWeekStart(parseInt(year, 10), week);
      const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      return { from, to };
    }

    if (query.from && query.to) {
      return {
        from: new Date(`${query.from}T00:00:00.000Z`),
        to: new Date(`${query.to}T23:59:59.999Z`),
      };
    }

    // Default: current month to resolve history/analytics properly
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    return { from, to };
  }

  private _isoWeekStart(year: number, week: number): Date {
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = jan4.getUTCDay() || 7;
    const weekStart = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
    weekStart.setUTCDate(weekStart.getUTCDate() + (week - 1) * 7);
    return weekStart;
  }

  private _startOfCurrentWeek(): Date {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
    return monday;
  }
}
