import { AttendanceRepository } from '../repositories/attendance.repository';
import { CheckInDto } from './dto/check-in.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
export declare class AttendanceService {
    private readonly attendanceRepo;
    constructor(attendanceRepo: AttendanceRepository);
    checkIn(userId: string, dto: CheckInDto): import("../repositories/attendance.repository").AttendanceRecord;
    checkOut(userId: string): {
        durationMinutes: number;
        id?: string | undefined;
        userId?: string | undefined;
        checkInTime?: string | undefined;
        checkOutTime?: string | null | undefined;
        notes?: string;
        createdAt?: string | undefined;
    };
    getAttendance(userId: string, query: AttendanceQueryDto): import("../repositories/attendance.repository").AttendanceRecord[];
    getDashboard(query: AttendanceQueryDto): {
        period: {
            from: string;
            to: string;
        };
        totalPresent: number;
        totalSessions: number;
        completedSessions: number;
        totalDurationMinutes: number;
    };
    private _resolveRange;
    private _isoWeekStart;
}
