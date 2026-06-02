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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const attendance_repository_1 = require("../repositories/attendance.repository");
let AttendanceService = class AttendanceService {
    constructor(attendanceRepo) {
        this.attendanceRepo = attendanceRepo;
    }
    checkIn(userId, dto) {
        const open = this.attendanceRepo.findOpenCheckIn(userId);
        if (open) {
            throw new common_1.ConflictException('Already checked in — please check out first');
        }
        return this.attendanceRepo.create({
            userId,
            checkInTime: dto.checkInTime ?? new Date().toISOString(),
            checkOutTime: null,
            notes: dto.notes,
        });
    }
    checkOut(userId, dto) {
        const open = this.attendanceRepo.findOpenCheckIn(userId);
        if (!open) {
            throw new common_1.NotFoundException('No active check-in found');
        }
        const checkOutTime = new Date().toISOString();
        const durationMinutes = Math.round((new Date(checkOutTime).getTime() - new Date(open.checkInTime).getTime()) / 60000);
        const updated = this.attendanceRepo.updateById(open.id, {
            checkOutTime,
            ...(dto.notes !== undefined && { notes: dto.notes }),
        });
        return { ...updated, durationMinutes };
    }
    getAttendance(userId, query) {
        const { from, to } = this._resolveRange(query);
        return this.attendanceRepo.findByUserIdInRange(userId, from, to);
    }
    getDashboard(query) {
        const { from, to } = this._resolveRange(query);
        const records = this.attendanceRepo.findAllInRange(from, to);
        const checkedIn = new Set(records.map((r) => r.userId));
        const completedSessions = records.filter((r) => r.checkOutTime !== null);
        const totalDurationMinutes = completedSessions.reduce((sum, r) => {
            if (!r.checkOutTime)
                return sum;
            return (sum +
                Math.round((new Date(r.checkOutTime).getTime() - new Date(r.checkInTime).getTime()) / 60000));
        }, 0);
        return {
            period: { from: from.toISOString(), to: to.toISOString() },
            totalPresent: checkedIn.size,
            totalSessions: records.length,
            completedSessions: completedSessions.length,
            totalDurationMinutes,
        };
    }
    _resolveRange(query) {
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
        const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const to = new Date(from.getTime() + 24 * 60 * 60 * 1000 - 1);
        return { from, to };
    }
    _isoWeekStart(year, week) {
        const jan4 = new Date(Date.UTC(year, 0, 4));
        const dayOfWeek = jan4.getUTCDay() || 7;
        const weekStart = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
        weekStart.setUTCDate(weekStart.getUTCDate() + (week - 1) * 7);
        return weekStart;
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [attendance_repository_1.AttendanceRepository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map