import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus } from '../common/constants/roles.enum';

export interface UserEntity {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
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
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(user: any): UserEntity {
    return {
      id: user.id,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      phone: user.phone ?? undefined,
      role: user.role as Role,
      designation: user.designation ?? undefined,
      department: user.department ?? undefined,
      joiningDate: user.joiningDate ? user.joiningDate.toISOString().split('T')[0] : undefined,
      status: user.status as UserStatus,
      createdAt: user.createdAt.toISOString(),
      refreshToken: user.refreshToken,
    };
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany();
    return users.map((u) => this.mapToEntity(u));
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmployeeId(employeeId: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { employeeId } });
    return user ? this.mapToEntity(user) : null;
  }

  async create(dto: Omit<UserEntity, 'id' | 'createdAt'>): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        employeeId: dto.employeeId,
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
      await this.prisma.user.delete({ where: { id } });
      return true;
    } catch (e) {
      console.error('Error in UserRepository.deleteById:', e);
      return false;
    }
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  async search(query: string): Promise<UserEntity[]> {
    const q = query.toLowerCase();
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { employeeId: { contains: q, mode: 'insensitive' } },
          { department: { contains: q, mode: 'insensitive' } },
        ],
      },
    });
    return users.map((u) => this.mapToEntity(u));
  }

  async filter(criteria: { department?: string; status?: UserStatus; role?: Role }): Promise<UserEntity[]> {
    const where: any = {};
    if (criteria.department) where.department = criteria.department;
    if (criteria.status) where.status = criteria.status;
    if (criteria.role) where.role = criteria.role;

    const users = await this.prisma.user.findMany({ where });
    return users.map((u) => this.mapToEntity(u));
  }
}
