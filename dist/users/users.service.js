"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const attendance_repository_1 = require("../repositories/attendance.repository");
const user_repository_1 = require("../repositories/user.repository");
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const APPROX_WORKING_DAYS_PER_MONTH = 22;
const LATE_CHECKIN_HOUR = 9;
const LATE_CHECKIN_MINUTE = 30;
let UsersService = class UsersService {
    constructor(attendanceRepo, userRepo) {
        this.attendanceRepo = attendanceRepo;
        this.userRepo = userRepo;
    }
    getAttendanceStats(userId, query) {
        const user = this.userRepo.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const targetYear = query.year ?? new Date().getFullYear();
        const from = new Date(Date.UTC(targetYear, 0, 1));
        const to = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));
        const records = this.attendanceRepo.findByUserIdInRange(userId, from, to);
        const currentMonth = new Date().getUTCMonth() + 1;
        const currentYear = new Date().getFullYear();
        const maxMonth = targetYear === currentYear ? currentMonth : 12;
        const monthly = new Map();
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
            if (month > maxMonth)
                continue;
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
        const attendancePercentage = totalWorkingDays > 0
            ? Math.round((presentDays / totalWorkingDays) * 1000) / 10
            : 0;
        const averageWorkHours = completedSessions > 0
            ? Math.round((totalWorkMs / completedSessions / 3600000) * 10) / 10
            : 0;
        const monthlyBreakdown = Array.from(monthly.entries()).map(([month, data]) => ({
            month,
            monthName: MONTH_NAMES[month - 1],
            present: data.present,
            absent: Math.max(0, APPROX_WORKING_DAYS_PER_MONTH - data.present),
            late: data.late,
            percentage: APPROX_WORKING_DAYS_PER_MONTH > 0
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
    getActivity(userId, query) {
        const user = this.userRepo.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const allowedTypes = query.types
            ? new Set(query.types.split(',').map((t) => t.trim().toUpperCase()))
            : null;
        const allRecords = this.attendanceRepo.findByUserId(userId);
        const activities = [];
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
                const isLate = h > LATE_CHECKIN_HOUR || (h === LATE_CHECKIN_HOUR && m > LATE_CHECKIN_MINUTE);
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
                    const durationMin = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 60000);
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
        activities.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
        let filtered = query.before
            ? activities.filter((a) => a.occurredAt < query.before)
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
    _computeStreaks(records) {
        if (records.length === 0)
            return { currentStreak: 0, longestStreak: 0 };
        const dates = [
            ...new Set(records.map((r) => r.checkInTime.slice(0, 10))),
        ].sort((a, b) => b.localeCompare(a));
        let currentStreak = 0;
        let longestStreak = 0;
        let streak = 1;
        const today = new Date().toISOString().slice(0, 10);
        for (let i = 0; i < dates.length; i++) {
            if (i === 0) {
                const diff = this._dayDiff(today, dates[0]);
                currentStreak = diff <= 1 ? 1 : 0;
                streak = 1;
                longestStreak = 1;
                continue;
            }
            const diff = this._dayDiff(dates[i - 1], dates[i]);
            if (diff === 1) {
                streak++;
                if (i === 1 && currentStreak > 0)
                    currentStreak = streak;
                if (streak > longestStreak)
                    longestStreak = streak;
            }
            else {
                if (currentStreak === 0)
                    currentStreak = streak;
                streak = 1;
            }
        }
        if (currentStreak === 0)
            currentStreak = streak;
        return { currentStreak, longestStreak };
    }
    _dayDiff(laterDate, earlierDate) {
        const a = new Date(laterDate).getTime();
        const b = new Date(earlierDate).getTime();
        return Math.round(Math.abs(a - b) / 86400000);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [attendance_repository_1.AttendanceRepository,
        user_repository_1.UserRepository])
], UsersService);
//# sourceMappingURL=users.service.js.map