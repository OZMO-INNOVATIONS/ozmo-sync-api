import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus } from '../common/constants/roles.enum';
import { formatDate, formatDateTime } from '../common/utils/date-format.util';

export interface UserEntity {
  id: string;
  employeeId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  designation?: string;
  department?: string;
  joiningDate?: string;
  status: UserStatus;
  createdAt: string;
  refreshToken: string | null;
  workspaceId: string;
  workspaceName?: string;
  isFirstLogin: boolean;
  passwordChangedAt?: string;
  createdBy?: string;
  deletedAt?: string;

  // Profile fields
  profileImage?: string;
  alternatePhone?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  nationality?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
  departmentId?: string;
  designationId?: string;
  probationEndDate?: string;
  reportingManagerId?: string;
  employmentType?: string;
  workLocation?: string;
  salary?: number;
  bio?: string;
  lastLogin?: string;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) { }

  private mapToEntity(user: any): UserEntity {
    return {
      id: user.id,
      employeeId: user.employeeId,
      fullName: user.fullName,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      email: user.email,
      password: user.password,
      phone: user.phone ?? undefined,
      role: user.role as Role,
      designation: user.designation ?? undefined,
      department: user.department ?? undefined,
      joiningDate: user.joiningDate ? (formatDate(user.joiningDate) ?? undefined) : undefined,
      status: user.status as UserStatus,
      createdAt: formatDateTime(user.createdAt) ?? user.createdAt.toISOString(),
      refreshToken: user.refreshToken,
      workspaceId: user.workspaceId,
      workspaceName: user.workspaceName ?? undefined,
      isFirstLogin: user.isFirstLogin,
      passwordChangedAt: user.passwordChangedAt ? (formatDateTime(user.passwordChangedAt) ?? undefined) : undefined,
      createdBy: user.createdBy ?? undefined,
      deletedAt: user.deletedAt ? (formatDateTime(user.deletedAt) ?? undefined) : undefined,

      // Profile fields
      profileImage: user.profileImage ?? undefined,
      alternatePhone: user.alternatePhone ?? undefined,
      gender: user.gender ?? undefined,
      dateOfBirth: user.dateOfBirth ? (formatDate(user.dateOfBirth) ?? undefined) : undefined,
      bloodGroup: user.bloodGroup ?? undefined,
      maritalStatus: user.maritalStatus ?? undefined,
      nationality: user.nationality ?? undefined,
      address: user.address ?? undefined,
      city: user.city ?? undefined,
      state: user.state ?? undefined,
      country: user.country ?? undefined,
      postalCode: user.postalCode ?? undefined,
      emergencyContactName: user.emergencyContactName ?? undefined,
      emergencyContactNumber: user.emergencyContactNumber ?? undefined,
      emergencyContactRelation: user.emergencyContactRelation ?? undefined,
      departmentId: user.departmentId ?? undefined,
      designationId: user.designationId ?? undefined,
      probationEndDate: user.probationEndDate ? (formatDate(user.probationEndDate) ?? undefined) : undefined,
      reportingManagerId: user.reportingManagerId ?? undefined,
      employmentType: user.employmentType ?? undefined,
      workLocation: user.workLocation ?? undefined,
      salary: user.salary ? Number(user.salary) : undefined,
      bio: user.bio ?? undefined,
      lastLogin: user.lastLogin ? (formatDateTime(user.lastLogin) ?? undefined) : undefined,
    };
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
    });
    return users.map((u) => this.mapToEntity(u));
  }

  async findFilteredPaged(
    where: { department?: string; status?: UserStatus; role?: Role; search?: string },
    options: { page?: number; limit?: number; sort?: string }
  ): Promise<UserEntity[]> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const filterWhere: any = { deletedAt: null };
    if (where.department) filterWhere.department = where.department;
    if (where.status) filterWhere.status = where.status;
    if (where.role) filterWhere.role = where.role;

    if (where.search) {
      const q = where.search.toLowerCase();
      filterWhere.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { employeeId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = [];
    if (options.sort === 'name') {
      orderBy.push({ fullName: 'asc' });
    } else if (options.sort === 'joiningDate') {
      orderBy.push({ joiningDate: 'asc' });
    } else {
      orderBy.push({ createdAt: 'desc' });
    }

    const users = await this.prisma.user.findMany({
      where: filterWhere,
      orderBy,
      skip,
      take: limit,
    });
    return users.map((u) => this.mapToEntity(u));
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email: normalized, deletedAt: null },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmployeeId(employeeId: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { employeeId, deletedAt: null },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async create(dto: Omit<UserEntity, 'id' | 'createdAt'>): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        employeeId: dto.employeeId,
        fullName: dto.fullName,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        password: dto.password,
        phone: dto.phone,
        role: dto.role,
        designation: dto.designation,
        department: dto.department,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : null,
        status: dto.status,
        refreshToken: dto.refreshToken,
        workspaceId: dto.workspaceId,
        workspaceName: dto.workspaceName,
        isFirstLogin: dto.isFirstLogin,
        passwordChangedAt: dto.passwordChangedAt ? new Date(dto.passwordChangedAt) : null,
        createdBy: dto.createdBy,

        // Profile fields
        profileImage: dto.profileImage,
        alternatePhone: dto.alternatePhone,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        bloodGroup: dto.bloodGroup,
        maritalStatus: dto.maritalStatus,
        nationality: dto.nationality,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        postalCode: dto.postalCode,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactNumber: dto.emergencyContactNumber,
        emergencyContactRelation: dto.emergencyContactRelation,
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        probationEndDate: dto.probationEndDate ? new Date(dto.probationEndDate) : null,
        reportingManagerId: dto.reportingManagerId,
        employmentType: dto.employmentType,
        workLocation: dto.workLocation,
        salary: dto.salary,
        bio: dto.bio,
        lastLogin: dto.lastLogin ? new Date(dto.lastLogin) : null,
      },
    });
    return this.mapToEntity(user);
  }

  async updateById(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    try {
      const data: any = { ...updates };
      delete data.id;
      delete data.createdAt;
      if (updates.email) {
        data.email = updates.email.toLowerCase();
      }
      if (updates.joiningDate !== undefined) {
        data.joiningDate = updates.joiningDate ? new Date(updates.joiningDate) : null;
      }
      if (updates.passwordChangedAt !== undefined) {
        data.passwordChangedAt = updates.passwordChangedAt ? new Date(updates.passwordChangedAt) : null;
      }
      if (updates.deletedAt !== undefined) {
        data.deletedAt = updates.deletedAt ? new Date(updates.deletedAt) : null;
      }
      if (updates.dateOfBirth !== undefined) {
        data.dateOfBirth = updates.dateOfBirth ? new Date(updates.dateOfBirth) : null;
      }
      if (updates.probationEndDate !== undefined) {
        data.probationEndDate = updates.probationEndDate ? new Date(updates.probationEndDate) : null;
      }
      if (updates.lastLogin !== undefined) {
        data.lastLogin = updates.lastLogin ? new Date(updates.lastLogin) : null;
      }
      const user = await this.prisma.user.update({
        where: { id },
        data,
      });
      return this.mapToEntity(user);
    } catch (e) {
      console.error('Error in UserRepository.updateById:', e);
      return null;
    }
  }

  async saveRefreshToken(id: string, token: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: token },
    });
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch (e) {
      console.error('Error in UserRepository.deleteById:', e);
      return false;
    }
  }

  async count(includeDeleted = false): Promise<number> {
    return this.prisma.user.count({
      where: includeDeleted ? undefined : { deletedAt: null },
    });
  }

  async search(query: string): Promise<UserEntity[]> {
    const q = query.toLowerCase();
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { employeeId: { contains: q, mode: 'insensitive' } },
        ],
      },
    });
    return users.map((u) => this.mapToEntity(u));
  }

  async filter(criteria: { department?: string; status?: UserStatus; role?: Role }): Promise<UserEntity[]> {
    const where: any = { deletedAt: null };
    if (criteria.department) where.department = criteria.department;
    if (criteria.status) where.status = criteria.status;
    if (criteria.role) where.role = criteria.role;

    const users = await this.prisma.user.findMany({ where });
    return users.map((u) => this.mapToEntity(u));
  }
}
