import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { CheckInDto } from './dto/check-in.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly attendanceRepo: AttendanceRepository) {}

  checkIn(userId: string, dto: CheckInDto) {
    const open = this.attendanceRepo.findOpenCheckIn(userId);
    if (open) {
      throw new ConflictException('Already checked in — please check out first');
    }

    return this.attendanceRepo.create({
      userId,
      checkInTime: dto.checkInTime ?? new Date().toISOString(),
      checkOutTime: null,
      notes: dto.notes,
    });
  }

  checkOut(userId: string) {
    const open = this.attendanceRepo.findOpenCheckIn(userId);
    if (!open) {
      throw new NotFoundException('No active check-in found');
    }

    const checkOutTime = new Date().toISOString();
    const durationMinutes = Math.round(
      (new Date(checkOutTime).getTime() - new Date(open.checkInTime).getTime()) / 60000,
    );

    const updated = this.attendanceRepo.updateById(open.id, { checkOutTime });
    return { ...updated, durationMinutes };
  }

  getAttendance(userId: string, query: AttendanceQueryDto) {
    const { from, to } = this._resolveRange(query);
    return this.attendanceRepo.findByUserIdInRange(userId, from, to);
  }

  getDashboard(query: AttendanceQueryDto) {
    const { from, to } = this._resolveRange(query);
    const records = this.attendanceRepo.findAllInRange(from, to);

    const checkedIn = new Set(records.map((r) => r.userId));
    const completedSessions = records.filter((r) => r.checkOutTime !== null);

    const totalDurationMinutes = completedSessions.reduce((sum, r) => {
      if (!r.checkOutTime) return sum;
      return (
        sum +
        Math.round(
          (new Date(r.checkOutTime).getTime() - new Date(r.checkInTime).getTime()) / 60000,
        )
      );
    }, 0);

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      totalPresent: checkedIn.size,
      totalSessions: records.length,
      completedSessions: completedSessions.length,
      totalDurationMinutes,
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

    // Default: today
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000 - 1);
    return { from, to };
  }

  private _isoWeekStart(year: number, week: number): Date {
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = jan4.getUTCDay() || 7;
    const weekStart = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
    weekStart.setUTCDate(weekStart.getUTCDate() + (week - 1) * 7);
    return weekStart;
  }
}
