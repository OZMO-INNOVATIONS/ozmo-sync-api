import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceRepository, AttendanceRecord } from '../repositories/attendance.repository';
import { UserRepository } from '../repositories/user.repository';
import { AttendanceStatsQueryDto } from './dto/attendance-stats-query.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const APPROX_WORKING_DAYS_PER_MONTH = 22;
const LATE_CHECKIN_HOUR = 9;
const LATE_CHECKIN_MINUTE = 30;

@Injectable()
export class UsersService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly userRepo: UserRepository,
  ) {}

  getAttendanceStats(userId: string, query: AttendanceStatsQueryDto) {
    const user = this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const targetYear = query.year ?? new Date().getFullYear();
    const from = new Date(Date.UTC(targetYear, 0, 1));
    const to = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

    const records = this.attendanceRepo.findByUserIdInRange(userId, from, to);

    const currentMonth = new Date().getUTCMonth() + 1;
    const currentYear = new Date().getFullYear();
    const maxMonth = targetYear === currentYear ? currentMonth : 12;

    // Monthly buckets
    const monthly = new Map<number, { present: number; late: number }>();
    for (let m = 1; m <= maxMonth; m++) {
      monthly.set(m, { present: 0, late: 0 });
    }

    let presentDays = 0;
    let lateDays = 0;
    let totalWorkMs = 0;
    let completedSessions = 0;

    for (const r of records) {
      const d = new Date(r.checkInTime);
      const month = d.getUTCMonth() + 1;
      if (month > maxMonth) continue;

      const bucket = monthly.get(month);
      if (bucket) {
        bucket.present++;
        const h = d.getUTCHours();
        const m = d.getUTCMinutes();
        if (h > LATE_CHECKIN_HOUR || (h === LATE_CHECKIN_HOUR && m > LATE_CHECKIN_MINUTE)) {
          bucket.late++;
          lateDays++;
        }
      }
      presentDays++;

      if (r.checkOutTime) {
        totalWorkMs += new Date(r.checkOutTime).getTime() - new Date(r.checkInTime).getTime();
        completedSessions++;
      }
    }

    const totalWorkingDays = maxMonth * APPROX_WORKING_DAYS_PER_MONTH;
    const absentDays = Math.max(0, totalWorkingDays - presentDays);
    const attendancePercentage =
      totalWorkingDays > 0
        ? Math.round((presentDays / totalWorkingDays) * 1000) / 10
        : 0;
    const averageWorkHours =
      completedSessions > 0
        ? Math.round((totalWorkMs / completedSessions / 3600000) * 10) / 10
        : 0;

    const monthlyBreakdown = Array.from(monthly.entries()).map(([month, data]) => ({
      month,
      monthName: MONTH_NAMES[month - 1],
      present: data.present,
      absent: Math.max(0, APPROX_WORKING_DAYS_PER_MONTH - data.present),
      late: data.late,
      percentage:
        APPROX_WORKING_DAYS_PER_MONTH > 0
          ? Math.round((data.present / APPROX_WORKING_DAYS_PER_MONTH) * 1000) / 10
          : 0,
    }));

    const { currentStreak, longestStreak } = this._computeStreaks(records);

    return {
      userId,
      year: targetYear,
      summary: {
        totalWorkingDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays: 0,
        wfhDays: 0,
        attendancePercentage,
        averageWorkHours,
      },
      monthlyBreakdown,
      streak: { currentStreak, longestStreak },
    };
  }

  getActivity(userId: string, query: ActivityQueryDto) {
    const user = this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const allowedTypes = query.types
      ? new Set(query.types.split(',').map((t) => t.trim().toUpperCase()))
      : null;

    // Build activity items from attendance records
    const allRecords = this.attendanceRepo.findByUserId(userId);
    const activities: {
      id: string;
      type: string;
      subType: string;
      title: string;
      description: string;
      icon: string;
      color: string;
      occurredAt: string;
      metadata: Record<string, unknown>;
    }[] = [];

    for (const r of allRecords) {
      if (!allowedTypes || allowedTypes.has('ATTENDANCE')) {
        const checkInDate = new Date(r.checkInTime);
        const timeStr = checkInDate.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'UTC',
        });
        const h = checkInDate.getUTCHours();
        const m = checkInDate.getUTCMinutes();
        const isLate =
          h > LATE_CHECKIN_HOUR || (h === LATE_CHECKIN_HOUR && m > LATE_CHECKIN_MINUTE);

        activities.push({
          id: `att-in-${r.id}`,
          type: 'ATTENDANCE',
          subType: 'CHECK_IN',
          title: 'Checked In',
          description: `Checked in at ${timeStr}`,
          icon: 'fingerprint',
          color: isLate ? '#F59E0B' : '#10B981',
          occurredAt: r.checkInTime,
          metadata: { checkInTime: r.checkInTime, status: isLate ? 'LATE' : 'ON_TIME' },
        });

        if (r.checkOutTime) {
          const checkOutDate = new Date(r.checkOutTime);
          const outTimeStr = checkOutDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC',
          });
          const durationMin = Math.round(
            (checkOutDate.getTime() - checkInDate.getTime()) / 60000,
          );

          activities.push({
            id: `att-out-${r.id}`,
            type: 'ATTENDANCE',
            subType: 'CHECK_OUT',
            title: 'Checked Out',
            description: `Checked out at ${outTimeStr} (${durationMin} min)`,
            icon: 'logout',
            color: '#6B7280',
            occurredAt: r.checkOutTime,
            metadata: { checkOutTime: r.checkOutTime, durationMinutes: durationMin },
          });
        }
      }
    }

    // Sort descending
    activities.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    // Apply before cursor
    let filtered = query.before
      ? activities.filter((a) => a.occurredAt < query.before!)
      : activities;

    const limit = Math.min(query.limit ?? 20, 100);
    const paginated = filtered.slice(0, limit + 1);
    const hasMore = paginated.length > limit;
    const result = paginated.slice(0, limit);
    const nextCursor = hasMore ? result[result.length - 1].occurredAt : null;

    return {
      userId,
      activities: result,
      nextCursor,
      hasMore,
    };
  }

  private _computeStreaks(records: AttendanceRecord[]) {
    if (records.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Deduplicate by date (multiple check-ins on same day count as one)
    const dates = [
      ...new Set(records.map((r) => r.checkInTime.slice(0, 10))),
    ].sort((a, b) => b.localeCompare(a));

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 1;
    const today = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        // Start streak — only count as current if the most recent date is today or yesterday
        const diff = this._dayDiff(today, dates[0]);
        currentStreak = diff <= 1 ? 1 : 0;
        streak = 1;
        longestStreak = 1;
        continue;
      }
      const diff = this._dayDiff(dates[i - 1], dates[i]);
      if (diff === 1) {
        streak++;
        if (i === 1 && currentStreak > 0) currentStreak = streak;
        if (streak > longestStreak) longestStreak = streak;
      } else {
        if (currentStreak === 0) currentStreak = streak;
        streak = 1;
      }
    }

    if (currentStreak === 0) currentStreak = streak;

    return { currentStreak, longestStreak };
  }

  private _dayDiff(laterDate: string, earlierDate: string): number {
    const a = new Date(laterDate).getTime();
    const b = new Date(earlierDate).getTime();
    return Math.round(Math.abs(a - b) / 86400000);
  }
}
