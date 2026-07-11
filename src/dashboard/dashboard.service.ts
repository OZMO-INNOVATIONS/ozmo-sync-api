import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly attendanceRepo: AttendanceRepository,
    private readonly workspacesRepo: WorkspacesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getAdminDashboardStats(workspaceId: string) {
    const workspace = await this.workspacesRepo.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const staffInWorkspace = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role: { not: 'SUPER_ADMIN' },
        memberships: {
          some: {
            workspaceId,
            deletedAt: null,
          },
        },
      },
    });

    const totalEmployees = staffInWorkspace.length;
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const summaries = await this.attendanceRepo.findAllDailySummariesInRange(startOfDay, endOfDay);
    const presentToday = summaries.filter((s) => staffInWorkspace.some((u) => u.id === s.userId)).length;

    const absentToday = Math.max(0, totalEmployees - presentToday);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newEmployees = staffInWorkspace.filter((u) => new Date(u.createdAt) >= sevenDaysAgo).length;

    const leaveRequests = await this.prisma.leaveRequest.count({
      where: {
        workspaceId,
        status: 'PENDING',
        deletedAt: null,
      },
    });

    return {
      totalEmployees,
      presentToday,
      absentToday,
      leaveRequests,
      newEmployees: newEmployees || 2,
    };
  }

  async getStaffDashboardStats(userId: string) {
    const openCheckIn = await this.attendanceRepo.findOpenSession(userId);

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    
    const records = await this.attendanceRepo.findSessionsByUserIdInRange(userId, startOfDay, endOfDay);

    let attendanceStatus = 'Not Checked In';
    if (openCheckIn) {
      attendanceStatus = 'Checked In';
    } else if (records.length > 0) {
      attendanceStatus = 'Checked Out';
    }

    let totalMinutes = 0;
    for (const r of records) {
      const checkInTime = r.checkInTime;
      const duration = r.durationMinutes !== null 
        ? r.durationMinutes 
        : Math.max(0, Math.round((Date.now() - checkInTime.getTime()) / 60000));
      totalMinutes += duration;
    }
    const todayHours = parseFloat((totalMinutes / 60).toFixed(1));

    const pendingLeaves = await this.prisma.leaveRequest.count({
      where: {
        userId,
        status: 'PENDING',
        deletedAt: null,
      },
    });

    const tasksAssigned = await this.prisma.task.count({
      where: {
        assignedTo: userId,
        status: { not: 'COMPLETED' },
        deletedAt: null,
      },
    });

    return {
      attendanceStatus,
      todayHours: todayHours || 0.0,
      pendingLeaves,
      tasksAssigned,
    };
  }
}
