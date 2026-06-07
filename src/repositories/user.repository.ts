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
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(user: any): UserEntity {
    const profile = user.staffProfile || {};
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: user.id,
      employeeId: profile.employeeId || '',
      fullName,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: user.email,
      password: user.password,
      phone: profile.phone || undefined,
      role: user.role as Role,
      designation: profile.designation || undefined,
      department: profile.department || undefined,
      joiningDate: profile.joiningDate ? (formatDate(profile.joiningDate) ?? undefined) : undefined,
      status: user.status as UserStatus,
      createdAt: formatDateTime(user.createdAt) ?? user.createdAt.toISOString(),
      refreshToken: user.refreshToken,
      workspaceId: user.workspaceId,
      workspaceName: user.workspaceName || undefined,
      isFirstLogin: profile.isFirstLogin ?? true,
      passwordChangedAt: profile.passwordChangedAt ? (formatDateTime(profile.passwordChangedAt) ?? undefined) : undefined,
      createdBy: user.createdBy || undefined,
      deletedAt: profile.deletedAt ? (formatDateTime(profile.deletedAt) ?? undefined) : undefined,

      // Profile fields
      profileImage: profile.profileImage || undefined,
      alternatePhone: profile.alternatePhone || undefined,
      gender: profile.gender || undefined,
      dateOfBirth: profile.dateOfBirth ? (formatDate(profile.dateOfBirth) ?? undefined) : undefined,
      bloodGroup: profile.bloodGroup || undefined,
      maritalStatus: profile.maritalStatus || undefined,
      nationality: profile.nationality || undefined,
      address: profile.address || undefined,
      city: profile.city || undefined,
      state: profile.state || undefined,
      country: profile.country || undefined,
      postalCode: profile.postalCode || undefined,
      emergencyContactName: profile.emergencyContactName || undefined,
      emergencyContactNumber: profile.emergencyContactNumber || undefined,
      emergencyContactRelation: profile.emergencyContactRelation || undefined,
      departmentId: profile.departmentId || undefined,
      designationId: profile.designationId || undefined,
      probationEndDate: profile.probationEndDate ? (formatDate(profile.probationEndDate) ?? undefined) : undefined,
      reportingManagerId: profile.reportingManagerId || undefined,
      employmentType: profile.employmentType || undefined,
      workLocation: profile.workLocation || undefined,
      salary: profile.salary ? Number(profile.salary) : undefined,
      bio: profile.bio || undefined,
      lastLogin: user.lastLogin ? (formatDateTime(user.lastLogin) ?? undefined) : undefined,
    };
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [{ staffProfile: null }, { staffProfile: { deletedAt: null } }]
      },
      include: { staffProfile: true },
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

    const filterWhere: any = {
      OR: [{ staffProfile: null }, { staffProfile: { deletedAt: null } }]
    };

    if (where.department) {
      filterWhere.staffProfile = { ...filterWhere.staffProfile, department: where.department };
    }
    if (where.status) {
      filterWhere.status = where.status;
    }
    if (where.role) {
      filterWhere.role = where.role;
    }

    if (where.search) {
      const q = where.search.toLowerCase();
      filterWhere.AND = [
        ...(filterWhere.AND || []),
        {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { staffProfile: { employeeId: { contains: q, mode: 'insensitive' } } },
          ]
        }
      ];
    }

    const orderBy: any = [];
    if (options.sort === 'name') {
      orderBy.push({ firstName: 'asc' });
    } else if (options.sort === 'joiningDate') {
      orderBy.push({ staffProfile: { joiningDate: 'asc' } });
    } else {
      orderBy.push({ createdAt: 'desc' });
    }

    const users = await this.prisma.user.findMany({
      where: filterWhere,
      orderBy,
      skip,
      take: limit,
      include: { staffProfile: true },
    });
    return users.map((u) => this.mapToEntity(u));
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        OR: [{ staffProfile: null }, { staffProfile: { deletedAt: null } }]
      },
      include: { staffProfile: true },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        email: normalized,
        OR: [{ staffProfile: null }, { staffProfile: { deletedAt: null } }]
      },
      include: { staffProfile: true },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmployeeId(employeeId: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        staffProfile: {
          employeeId,
          deletedAt: null
        }
      },
      include: { staffProfile: true },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async create(dto: Omit<UserEntity, 'id' | 'createdAt'>): Promise<UserEntity> {
    const isNoProfileRole = dto.role === Role.ADMIN || dto.role === Role.SUPER_ADMIN;

    const data: any = {
      email: dto.email.toLowerCase(),
      password: dto.password,
      role: dto.role,
      status: dto.status,
      refreshToken: dto.refreshToken,
      workspaceId: dto.workspaceId,
      firstName: dto.firstName || null,
      lastName: dto.lastName || null,
      lastLogin: dto.lastLogin ? new Date(dto.lastLogin) : null,
    };

    if (!isNoProfileRole) {
      data.staffProfile = {
        create: {
          workspaceId: dto.workspaceId,
          employeeId: dto.employeeId,
          phone: dto.phone || null,
          alternatePhone: dto.alternatePhone || null,
          designation: dto.designation || null,
          department: dto.department || null,
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : null,
          employmentType: dto.employmentType || null,
          salary: dto.salary ? Number(dto.salary) : null,
          gender: dto.gender || null,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          address: dto.address || null,
          city: dto.city || null,
          state: dto.state || null,
          country: dto.country || null,
          postalCode: dto.postalCode || null,
          emergencyContactName: dto.emergencyContactName || null,
          emergencyContactNumber: dto.emergencyContactNumber || null,
          profileImage: dto.profileImage || null,
          isFirstLogin: dto.isFirstLogin ?? true,
          passwordChangedAt: dto.passwordChangedAt ? new Date(dto.passwordChangedAt) : null,
          reportingManagerId: dto.reportingManagerId || null,
        }
      };
    }

    const user = await this.prisma.user.create({
      data,
      include: { staffProfile: true },
    });
    return this.mapToEntity(user);
  }

  async updateById(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { id },
        include: { staffProfile: true },
      });
      if (!existing) return null;

      const userUpdate: any = {};
      const profileUpdate: any = {};

      if (updates.email) userUpdate.email = updates.email.toLowerCase();
      if (updates.password) userUpdate.password = updates.password;
      if (updates.role) userUpdate.role = updates.role;
      if (updates.status) userUpdate.status = updates.status;
      if (updates.refreshToken !== undefined) userUpdate.refreshToken = updates.refreshToken;
      if (updates.lastLogin !== undefined) userUpdate.lastLogin = updates.lastLogin ? new Date(updates.lastLogin) : null;
      if (updates.workspaceId) userUpdate.workspaceId = updates.workspaceId;
      if (updates.firstName !== undefined) userUpdate.firstName = updates.firstName;
      if (updates.lastName !== undefined) userUpdate.lastName = updates.lastName;

      if (updates.employeeId !== undefined) profileUpdate.employeeId = updates.employeeId;
      if (updates.phone !== undefined) profileUpdate.phone = updates.phone;
      if (updates.alternatePhone !== undefined) profileUpdate.alternatePhone = updates.alternatePhone;
      if (updates.designation !== undefined) profileUpdate.designation = updates.designation;
      if (updates.department !== undefined) profileUpdate.department = updates.department;
      if (updates.joiningDate !== undefined) profileUpdate.joiningDate = updates.joiningDate ? new Date(updates.joiningDate) : null;
      if (updates.employmentType !== undefined) profileUpdate.employmentType = updates.employmentType;
      if (updates.salary !== undefined) profileUpdate.salary = updates.salary ? Number(updates.salary) : null;
      if (updates.gender !== undefined) profileUpdate.gender = updates.gender;
      if (updates.dateOfBirth !== undefined) profileUpdate.dateOfBirth = updates.dateOfBirth ? new Date(updates.dateOfBirth) : null;
      if (updates.address !== undefined) profileUpdate.address = updates.address;
      if (updates.city !== undefined) profileUpdate.city = updates.city;
      if (updates.state !== undefined) profileUpdate.state = updates.state;
      if (updates.country !== undefined) profileUpdate.country = updates.country;
      if (updates.postalCode !== undefined) profileUpdate.postalCode = updates.postalCode;
      if (updates.emergencyContactName !== undefined) profileUpdate.emergencyContactName = updates.emergencyContactName;
      if (updates.emergencyContactNumber !== undefined) profileUpdate.emergencyContactNumber = updates.emergencyContactNumber;
      if (updates.profileImage !== undefined) profileUpdate.profileImage = updates.profileImage;
      if (updates.isFirstLogin !== undefined) profileUpdate.isFirstLogin = updates.isFirstLogin;
      if (updates.passwordChangedAt !== undefined) profileUpdate.passwordChangedAt = updates.passwordChangedAt ? new Date(updates.passwordChangedAt) : null;
      if (updates.reportingManagerId !== undefined) profileUpdate.reportingManagerId = updates.reportingManagerId;
      if (updates.deletedAt !== undefined) profileUpdate.deletedAt = updates.deletedAt ? new Date(updates.deletedAt) : null;

      const data: any = { ...userUpdate };
      const isNoProfileRole = (updates.role || existing.role) === Role.ADMIN || (updates.role || existing.role) === Role.SUPER_ADMIN;

      if (Object.keys(profileUpdate).length > 0 && !isNoProfileRole) {
        data.staffProfile = {
          upsert: {
            create: {
              ...profileUpdate,
              workspaceId: existing.workspaceId,
              employeeId: profileUpdate.employeeId || existing.staffProfile?.employeeId || `EMP-${Date.now()}`,
            },
            update: profileUpdate,
          }
        };
      }

      const user = await this.prisma.user.update({
        where: { id },
        data,
        include: { staffProfile: true },
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
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { staffProfile: true }
      });
      
      if (!user) return false;

      if (user.staffProfile) {
        await this.prisma.staffProfile.update({
          where: { userId: id },
          data: { deletedAt: new Date() },
        });
      } else {
        // Hard delete users without profiles (ADMINs) since they can't be soft deleted properly
        await this.prisma.user.delete({
          where: { id }
        });
      }
      return true;
    } catch (e) {
      console.error('Error in UserRepository.deleteById:', e);
      return false;
    }
  }

  async count(includeDeleted = false): Promise<number> {
    const whereCondition = includeDeleted ? undefined : {
      OR: [{ staffProfile: null }, { staffProfile: { deletedAt: null } }]
    };
    return this.prisma.user.count({
      where: whereCondition,
    });
  }

  async search(query: string): Promise<UserEntity[]> {
    const q = query.toLowerCase();
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { staffProfile: null },
          { staffProfile: { deletedAt: null } }
        ],
        AND: [
          {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { staffProfile: { employeeId: { contains: q, mode: 'insensitive' } } },
            ]
          }
        ]
      },
      include: { staffProfile: true },
    });
    return users.map((u) => this.mapToEntity(u));
  }

  async filter(criteria: { department?: string; status?: UserStatus; role?: Role }): Promise<UserEntity[]> {
    const where: any = {
      OR: [{ staffProfile: null }, { staffProfile: { deletedAt: null } }]
    };
    if (criteria.department) where.staffProfile = { department: criteria.department };
    if (criteria.status) where.status = criteria.status;
    if (criteria.role) where.role = criteria.role;

    const users = await this.prisma.user.findMany({
      where,
      include: { staffProfile: true },
    });
    return users.map((u) => this.mapToEntity(u));
  }
}
