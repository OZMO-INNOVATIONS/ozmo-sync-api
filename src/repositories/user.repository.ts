import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus } from '../common/constants/roles.enum';

export interface UserEntity {
  id: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  password?: string;
  profilePhoto?: string;
  isFirstLogin: boolean;
  status: UserStatus;
  role: Role;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  workspaceId?: string;

  // Profile fields
  alternatePhone?: string;
  designation?: string;
  department?: string;
  reportingManagerId?: string;
  joiningDate?: Date;
  employmentType?: string;
  salary?: number;
  gender?: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  nationality?: string;
  probationEndDate?: Date;
  workLocation?: string;
  bio?: string;
  passwordChangedAt?: Date;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(user: any): UserEntity {
    return {
      id: user.id,
      employeeId: user.employeeId ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      email: user.email,
      password: user.password,
      phone: user.phone ?? undefined,
      profilePhoto: user.profilePhoto ?? undefined,
      isFirstLogin: user.isFirstLogin,
      status: user.status as UserStatus,
      role: user.role as Role,
      lastLogin: user.lastLogin ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt ?? undefined,
      createdBy: user.createdBy ?? undefined,
      updatedBy: user.updatedBy ?? undefined,
      workspaceId: user.workspaceId ?? undefined,

      alternatePhone: user.alternatePhone ?? undefined,
      designation: user.designation ?? undefined,
      department: user.department ?? undefined,
      reportingManagerId: user.reportingManagerId ?? undefined,
      joiningDate: user.joiningDate ?? undefined,
      employmentType: user.employmentType ?? undefined,
      salary: user.salary ? Number(user.salary) : undefined,
      gender: user.gender ?? undefined,
      dateOfBirth: user.dateOfBirth ?? undefined,
      address: user.address ?? undefined,
      city: user.city ?? undefined,
      state: user.state ?? undefined,
      country: user.country ?? undefined,
      postalCode: user.postalCode ?? undefined,
      emergencyContactName: user.emergencyContactName ?? undefined,
      emergencyContactNumber: user.emergencyContactNumber ?? undefined,
      emergencyContactRelation: user.emergencyContactRelation ?? undefined,
      bloodGroup: user.bloodGroup ?? undefined,
      maritalStatus: user.maritalStatus ?? undefined,
      nationality: user.nationality ?? undefined,
      probationEndDate: user.probationEndDate ?? undefined,
      workLocation: user.workLocation ?? undefined,
      bio: user.bio ?? undefined,
      passwordChangedAt: user.passwordChangedAt ?? undefined,
    };
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
    });
    return users.map((u) => this.mapToEntity(u));
  }

  async findFilteredPaged(
    where: { status?: UserStatus; search?: string; workspaceId?: string; department?: string; role?: Role },
    options: { page?: number; limit?: number; sort?: string }
  ): Promise<UserEntity[]> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const filterWhere: any = { deletedAt: null };

    if (where.status) {
      filterWhere.status = where.status;
    }
    if (where.role) {
      filterWhere.role = where.role;
    }
    if (where.department) {
      filterWhere.department = where.department;
    }
    if (where.workspaceId) {
      filterWhere.memberships = {
        some: {
          workspaceId: where.workspaceId,
          deletedAt: null,
        },
      };
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
            { employeeId: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const orderBy: any = [];
    if (options.sort === 'name') {
      orderBy.push({ firstName: 'asc' });
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
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    if (!isUuid) {
      return this.findByEmployeeId(id);
    }
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.toLowerCase().trim();
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

  async create(dto: Partial<UserEntity> & { email: string; password?: string }): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        password: dto.password || '',
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        profilePhoto: dto.profilePhoto,
        isFirstLogin: dto.isFirstLogin ?? true,
        status: (dto.status as any) ?? UserStatus.ACTIVE,
        role: (dto.role as any) ?? Role.STAFF,
        employeeId: dto.employeeId,
        workspaceId: dto.workspaceId,
        createdBy: dto.createdBy,

        alternatePhone: dto.alternatePhone,
        designation: dto.designation,
        department: dto.department,
        reportingManagerId: dto.reportingManagerId,
        joiningDate: dto.joiningDate,
        employmentType: dto.employmentType,
        salary: dto.salary,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        postalCode: dto.postalCode,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactNumber: dto.emergencyContactNumber,
        emergencyContactRelation: dto.emergencyContactRelation,
        bloodGroup: dto.bloodGroup,
        maritalStatus: dto.maritalStatus,
        nationality: dto.nationality,
        probationEndDate: dto.probationEndDate,
        workLocation: dto.workLocation,
        bio: dto.bio,
      },
    });
    return this.mapToEntity(user);
  }

  async updateById(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    try {
      const data: any = {};
      if (updates.email) data.email = updates.email.toLowerCase().trim();
      if (updates.password) data.password = updates.password;
      if (updates.firstName !== undefined) data.firstName = updates.firstName;
      if (updates.lastName !== undefined) data.lastName = updates.lastName;
      if (updates.phone !== undefined) data.phone = updates.phone;
      if (updates.profilePhoto !== undefined) data.profilePhoto = updates.profilePhoto;
      if (updates.isFirstLogin !== undefined) data.isFirstLogin = updates.isFirstLogin;
      if (updates.status !== undefined) data.status = updates.status;
      if (updates.role !== undefined) data.role = updates.role;
      if (updates.lastLogin !== undefined) data.lastLogin = updates.lastLogin;
      if (updates.employeeId !== undefined) data.employeeId = updates.employeeId;
      if (updates.workspaceId !== undefined) data.workspaceId = updates.workspaceId;
      if (updates.updatedBy !== undefined) data.updatedBy = updates.updatedBy;
      if (updates.deletedAt !== undefined) data.deletedAt = updates.deletedAt;

      if (updates.alternatePhone !== undefined) data.alternatePhone = updates.alternatePhone;
      if (updates.designation !== undefined) data.designation = updates.designation;
      if (updates.department !== undefined) data.department = updates.department;
      if (updates.reportingManagerId !== undefined) data.reportingManagerId = updates.reportingManagerId;
      if (updates.joiningDate !== undefined) data.joiningDate = updates.joiningDate;
      if (updates.employmentType !== undefined) data.employmentType = updates.employmentType;
      if (updates.salary !== undefined) data.salary = updates.salary;
      if (updates.gender !== undefined) data.gender = updates.gender;
      if (updates.dateOfBirth !== undefined) data.dateOfBirth = updates.dateOfBirth;
      if (updates.address !== undefined) data.address = updates.address;
      if (updates.city !== undefined) data.city = updates.city;
      if (updates.state !== undefined) data.state = updates.state;
      if (updates.country !== undefined) data.country = updates.country;
      if (updates.postalCode !== undefined) data.postalCode = updates.postalCode;
      if (updates.emergencyContactName !== undefined) data.emergencyContactName = updates.emergencyContactName;
      if (updates.emergencyContactNumber !== undefined) data.emergencyContactNumber = updates.emergencyContactNumber;
      if (updates.emergencyContactRelation !== undefined) data.emergencyContactRelation = updates.emergencyContactRelation;
      if (updates.bloodGroup !== undefined) data.bloodGroup = updates.bloodGroup;
      if (updates.maritalStatus !== undefined) data.maritalStatus = updates.maritalStatus;
      if (updates.nationality !== undefined) data.nationality = updates.nationality;
      if (updates.probationEndDate !== undefined) data.probationEndDate = updates.probationEndDate;
      if (updates.workLocation !== undefined) data.workLocation = updates.workLocation;
      if (updates.bio !== undefined) data.bio = updates.bio;
      if (updates.passwordChangedAt !== undefined) data.passwordChangedAt = updates.passwordChangedAt;

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

  async saveRefreshToken(id: string, token: string | null, expiresAt?: Date): Promise<void> {
    if (token) {
      const finalExpiresAt = expiresAt || (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
      })();
      await this.prisma.refreshToken.upsert({
        where: { token },
        create: {
          userId: id,
          token,
          expiresAt: finalExpiresAt,
        },
        update: {
          expiresAt: finalExpiresAt,
          isRevoked: false,
        },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { isRevoked: true },
      });
    }
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
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
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

    const users = await this.prisma.user.findMany({
      where,
    });
    return users.map((u) => this.mapToEntity(u));
  }
}
