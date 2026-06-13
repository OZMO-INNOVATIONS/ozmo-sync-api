import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffFilterDto } from './dto/staff-filter.dto';
import { UserStatus, Role } from '../common/constants/roles.enum';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly workspacesRepo: WorkspacesRepository,
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateStaffDto, actor: RequestUser) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    let firstName = '';
    let lastName = '';
    if (dto.fullName) {
      const parts = dto.fullName.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    if (!firstName) {
      throw new ConflictException('Full name is required');
    }

    // Resolve workspace details from the creating admin
    const creator = await this.userRepo.findById(actor.id);
    if (!creator) throw new NotFoundException('Creator admin not found');
    const workspaceId = creator.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException('Creator does not belong to any workspace');
    }

    const ws = await this.workspacesRepo.findById(workspaceId);
    const workspaceName = ws?.name || '';

    const employeeId = await this._generateEmployeeId();

    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
    const tempPassword = dto.temporaryPassword || 'Welcome@123';
    const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

    const user = await this.userRepo.create({
      firstName,
      lastName,
      email: dto.email,
      password: passwordHash,
      phone: dto.phone,
      role: dto.role as any,
      designation: dto.designation,
      department: dto.department,
      joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
      employeeId,
      status: UserStatus.ACTIVE,
      workspaceId,
      isFirstLogin: true,
      createdBy: actor.id,
    });

    await this.workspaceMemberRepo.create({
      workspaceId,
      userId: user.id,
      role: dto.role as Role,
      status: UserStatus.ACTIVE,
      isPrimary: true,
      createdBy: actor.id,
    });

    await this.auditService.log({
      userId: actor.id,
      workspaceId,
      action: 'STAFF_CREATION',
      module: 'STAFF',
      newData: { email: user.email, role: user.role, employeeId: user.employeeId },
      detail: `Created staff member ${user.email} with role ${user.role}`,
    });

    return {
      id: user.id,
      employeeId: user.employeeId,
      isFirstLogin: user.isFirstLogin,
      temporaryPassword: tempPassword,
    };
  }

  async findAll(query?: StaffFilterDto, workspaceId?: string) {
    let users: any[];
    if (query) {
      users = await this.userRepo.findFilteredPaged(
        {
          department: query.department,
          status: query.status,
          role: query.role,
          search: query.search,
          workspaceId,
        },
        {
          page: query.page,
          limit: query.limit,
          sort: query.sort,
        }
      );
    } else {
      if (workspaceId) {
        users = await this.userRepo.findFilteredPaged({ workspaceId }, { limit: 1000 });
      } else {
        users = await this.userRepo.findAll();
      }
    }

    const today = new Date();
    const todayDateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        date: todayDateOnly,
        userId: { in: users.map((u) => u.id) },
        deletedAt: null,
      },
    });

    return users.map((u) => {
      const record = attendanceRecords.find((r) => r.userId === u.id);
      return {
        ...this._sanitize(u),
        attendanceStatus: record ? record.status : 'ABSENT',
      };
    });
  }

  async findById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Staff member not found');

    const profile = {
      address: user.address || null,
      emergencyContactName: user.emergencyContactName || null,
      emergencyContactNumber: user.emergencyContactNumber || null,
      emergencyContactRelation: user.emergencyContactRelation || null,
      bio: user.bio || null,
      skills: [],
      alternatePhone: user.alternatePhone || null,
      gender: user.gender || null,
      dateOfBirth: user.dateOfBirth || null,
      bloodGroup: user.bloodGroup || null,
      maritalStatus: user.maritalStatus || null,
      nationality: user.nationality || null,
      city: user.city || null,
      state: user.state || null,
      country: user.country || null,
      postalCode: user.postalCode || null,
      departmentId: user.department || null,
      designationId: user.designation || null,
      probationEndDate: user.probationEndDate || null,
      reportingManagerId: user.reportingManagerId || null,
      employmentType: user.employmentType || null,
      workLocation: user.workLocation || null,
      salary: user.salary || null,
    };

    return {
      user: this._sanitize(user),
      profile,
      attendanceSummary: {
        present: 20,
        absent: 2,
        late: 1,
        averageHours: 8.2
      },
      leaveSummary: {
        total: 15,
        taken: 5,
        remaining: 10,
        pending: 2
      },
      projects: [
        {
          id: '1',
          name: 'OZMO Sync App',
          role: user.role === Role.STAFF ? 'Developer' : 'Lead',
          status: 'Active'
        }
      ]
    };
  }

  async update(id: string, dto: UpdateStaffDto, actor: RequestUser) {
    const existing = await this.userRepo.findById(id);
    if (!existing) throw new NotFoundException('Staff member not found');

    const updates: Partial<any> = { ...dto };

    if (dto.fullName) {
      const parts = dto.fullName.trim().split(/\s+/);
      updates.firstName = parts[0] || '';
      updates.lastName = parts.slice(1).join(' ') || '';
    }

    if (dto.role && dto.role !== existing.role) {
      if (actor.workspaceId) {
        const workspaceMember = await this.workspaceMemberRepo.findByWorkspaceAndUser(actor.workspaceId, existing.id);
        if (workspaceMember) {
          await this.workspaceMemberRepo.updateMember(actor.workspaceId, existing.id, {
            role: dto.role,
            updatedBy: actor.id,
          });
        }
      }

      await this.auditService.log({
        userId: actor.id,
        workspaceId: actor.workspaceId,
        action: 'ROLE_CHANGE',
        module: 'STAFF',
        oldData: { role: existing.role },
        newData: { role: dto.role },
        detail: `Updated role of user ${existing.email} from ${existing.role} to ${dto.role}`,
      });
    }

    const updated = await this.userRepo.updateById(existing.id, updates);
    return this._sanitize(updated!);
  }

  async delete(id: string, actorId: string): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Staff member not found');
    if (user.id === actorId) throw new ForbiddenException('Cannot delete your own account');
    const deleted = await this.userRepo.deleteById(user.id);
    if (!deleted) throw new NotFoundException('Staff member not found');
  }

  async search(query: string) {
    const users = await this.userRepo.search(query);
    return users.map((u) => this._sanitize(u));
  }

  async filter(dto: StaffFilterDto) {
    const users = await this.userRepo.filter({
      department: dto.department,
      status: dto.status,
      role: dto.role,
    });
    return users.map((u) => this._sanitize(u));
  }

  private _sanitize(user: any) {
    const { password, refreshToken, ...safe } = user;
    void password; void refreshToken;
    return safe;
  }

  private async _generateEmployeeId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = (await this.userRepo.count(true)) + 1;
    return `OZ-${year}-${String(count).padStart(4, '0')}`;
  }
}
