import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    checkIn(user: RequestUser, dto: CheckInDto): {
        message: string;
        data: import("../repositories/attendance.repository").AttendanceRecord;
    };
    checkOut(user: RequestUser, dto: CheckOutDto): {
        message: string;
        data: {
            durationMinutes: number;
            id?: string | undefined;
            userId?: string | undefined;
            checkInTime?: string | undefined;
            checkOutTime?: string | null | undefined;
            notes?: string;
            createdAt?: string | undefined;
        };
    };
    getMyAttendance(user: RequestUser, query: AttendanceQueryDto): {
        message: string;
        data: import("../repositories/attendance.repository").AttendanceRecord[];
    };
    getDashboard(query: AttendanceQueryDto): {
        message: string;
        data: {
            period: {
                from: string;
                to: string;
            };
            totalPresent: number;
            totalSessions: number;
            completedSessions: number;
            totalDurationMinutes: number;
        };
    };
    getUserAttendance(userId: string, query: AttendanceQueryDto): {
        message: string;
        data: import("../repositories/attendance.repository").AttendanceRecord[];
    };
}
