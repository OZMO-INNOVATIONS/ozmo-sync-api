import { UsersService } from './users.service';
import { AttendanceStatsQueryDto } from './dto/attendance-stats-query.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getAttendanceStats(userId: string, query: AttendanceStatsQueryDto): {
        message: string;
        data: {
            userId: string;
            year: number;
            summary: {
                totalWorkingDays: number;
                presentDays: number;
                absentDays: number;
                lateDays: number;
                halfDays: number;
                wfhDays: number;
                attendancePercentage: number;
                averageWorkHours: number;
            };
            monthlyBreakdown: {
                month: number;
                monthName: string;
                present: number;
                absent: number;
                late: number;
                percentage: number;
            }[];
            streak: {
                currentStreak: number;
                longestStreak: number;
            };
        };
    };
    getActivity(userId: string, query: ActivityQueryDto): {
        message: string;
        data: {
            userId: string;
            activities: {
                id: string;
                type: string;
                subType: string;
                title: string;
                description: string;
                icon: string;
                color: string;
                occurredAt: string;
                metadata: Record<string, unknown>;
            }[];
            nextCursor: string | null;
            hasMore: boolean;
        };
    };
}
