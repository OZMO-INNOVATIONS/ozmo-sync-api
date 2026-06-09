import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitLeaveDto } from './dto/submit-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { Role } from '../common/constants/roles.enum';

@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workspaceId: string, userId: string, role: Role) {
    const isPrivileged = [Role.ADMIN, Role.SUPER_ADMIN, Role.HR, Role.MANAGER, Role.TEAM_LEAD].includes(role);

    if (isPrivileged) {
      return this.prisma.leaveRequest.findMany({
        where: { workspaceId },
        orderBy: { appliedAt: 'desc' },
      });
    }

    return this.prisma.leaveRequest.findMany({
      where: { workspaceId, userId },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async create(workspaceId: string, userId: string, dto: SubmitLeaveDto) {
    const data: any = {
      workspaceId,
      userId,
      employeeId: dto.employeeId,
      employeeName: dto.employeeName,
      department: dto.department ?? null,
      teamId: dto.teamId ?? null,
      category: dto.category.toLowerCase(),
      priority: dto.priority.toLowerCase(),
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      days: dto.days,
      reason: dto.reason,
      hasAttachment: dto.hasAttachment ?? false,
      status: (dto.status ?? 'pending').toLowerCase(),
      impactLevel: (dto.impactLevel ?? 'low').toLowerCase(),
      coverageStatus: (dto.coverageStatus ?? 'none').toLowerCase(),
      teamLeadNote: dto.teamLeadNote ?? '',
      appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : new Date(),
    };

    if (dto.id) {
      data.id = dto.id;
    }

    return this.prisma.leaveRequest.create({
      data,
    });
  }

  async updateStatus(id: string, workspaceId: string, dto: UpdateLeaveStatusDto) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, workspaceId },
    });

    if (!leave) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    const normalizedStatus = dto.status.toLowerCase();
    const reviewerName = dto.approvedBy || dto.rejectedBy || 'Admin';

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: normalizedStatus,
        approvedBy: normalizedStatus === 'approved' ? reviewerName : null,
        rejectionReason: normalizedStatus === 'rejected' ? (dto.rejectionReason ?? null) : null,
        reviewedAt: new Date(),
      },
    });
  }
}
