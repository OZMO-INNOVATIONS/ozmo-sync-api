import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitLeaveDto } from './dto/submit-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { Role } from '../common/constants/roles.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(workspaceId: string, userId: string, role: Role) {
    const isPrivileged = [Role.ADMIN, Role.SUPER_ADMIN, Role.HR, Role.TEAM_LEAD].includes(role);

    if (isPrivileged) {
      return this.prisma.leaveRequest.findMany({
        where: { workspaceId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { leaveType: true, user: true },
      });
    }

    return this.prisma.leaveRequest.findMany({
      where: { workspaceId, userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { leaveType: true, user: true },
    });
  }

  async create(workspaceId: string, userId: string, dto: SubmitLeaveDto) {
    // 1. Resolve or create LeaveType for this category name in the workspace
    const categoryName = dto.category.trim();
    let leaveType = await this.prisma.leaveType.findFirst({
      where: { workspaceId, name: { equals: categoryName, mode: 'insensitive' }, deletedAt: null },
    });

    if (!leaveType) {
      leaveType = await this.prisma.leaveType.create({
        data: {
          workspaceId,
          name: categoryName,
          daysAllowed: 15,
        },
      });
    }

    const data: any = {
      workspaceId,
      userId,
      leaveTypeId: leaveType.id,
      fromDate: new Date(dto.startDate),
      toDate: new Date(dto.endDate),
      days: dto.days,
      reason: dto.reason,
      status: (dto.status ?? 'PENDING').toUpperCase(),
    };

    if (dto.id) {
      data.id = dto.id;
    }

    const leave = await this.prisma.leaveRequest.create({
      data,
    });

    await this.auditService.log({
      userId,
      workspaceId,
      action: 'LEAVE_SUBMIT',
      module: 'LEAVES',
      newData: { leaveId: leave.id, days: leave.days, status: leave.status },
      detail: `Submitted leave request for ${leave.days} days`,
    });

    return leave;
  }

  async updateStatus(id: string, workspaceId: string, dto: UpdateLeaveStatusDto, reviewerUserId?: string) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });

    if (!leave) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    const normalizedStatus = dto.status.toUpperCase();
    const finalReviewerId = reviewerUserId || leave.userId; // Default context

    // Execute updates in a transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Log Leave Approval history audit trail
      await tx.leaveApproval.create({
        data: {
          workspaceId,
          leaveRequestId: leave.id,
          approvedBy: finalReviewerId,
          approvalLevel: 'ADMIN',
          decision: normalizedStatus,
          remarks: dto.rejectionReason || 'Reviewed leave request status update',
          approvedAt: new Date(),
        },
      });

      // 2. Perform leave balance deduction on approval
      if (normalizedStatus === 'APPROVED') {
        const balance = await tx.leaveBalance.findUnique({
          where: {
            userId_leaveTypeId: {
              userId: leave.userId,
              leaveTypeId: leave.leaveTypeId,
            },
          },
        });

        if (balance) {
          if (balance.balance < leave.days) {
            throw new BadRequestException('Insufficient leave balance for this request');
          }
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              balance: balance.balance - leave.days,
              used: balance.used + leave.days,
            },
          });
        } else {
          // If no balance record, assume default starting allowed days, deduct, and write record
          const lt = await tx.leaveType.findUnique({ where: { id: leave.leaveTypeId } });
          const defaultAllowed = lt?.daysAllowed ?? 15;
          await tx.leaveBalance.create({
            data: {
              workspaceId,
              userId: leave.userId,
              leaveTypeId: leave.leaveTypeId,
              balance: Math.max(0, defaultAllowed - leave.days),
              used: leave.days,
            },
          });
        }
      }

      // 3. Update the leave request itself
      const updatedLeave = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: normalizedStatus,
          approvedBy: normalizedStatus === 'APPROVED' ? finalReviewerId : null,
          rejectionReason: normalizedStatus === 'REJECTED' ? (dto.rejectionReason ?? null) : null,
          approvedAt: normalizedStatus === 'APPROVED' ? new Date() : null,
        },
      });

      await this.auditService.log({
        userId: finalReviewerId,
        workspaceId,
        action: 'LEAVE_APPROVAL',
        module: 'LEAVES',
        newData: { leaveId: updatedLeave.id, status: updatedLeave.status },
        detail: `Updated leave status to ${normalizedStatus}`,
      });

      return updatedLeave;
    });
  }
}
