import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { StaffProfileRepository } from '../repositories/staff-profile.repository';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffFilterDto } from './dto/staff-filter.dto';
import { UserStatus } from '../common/constants/roles.enum';

@Injectable()
export class StaffService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly profileRepo: StaffProfileRepository,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateStaffDto) {
    const existing = this.userRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);
    const employeeId = this._generateEmployeeId();

    const user = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      role: dto.role,
      designation: dto.designation,
      department: dto.department,
      joiningDate: dto.joiningDate,
      employeeId,
      status: UserStatus.ACTIVE,
      refreshToken: null,
    });

    this.profileRepo.create({ userId: user.id });

    return this._sanitize(user);
  }

  findAll() {
    return this.userRepo.findAll().map((u) => this._sanitize(u));
  }

  findById(id: string) {
    const user = this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Staff member not found');
    return this._sanitize(user);
  }

  async update(id: string, dto: UpdateStaffDto) {
    const existing = this.userRepo.findById(id);
    if (!existing) throw new NotFoundException('Staff member not found');

    const updates: Partial<typeof existing> = { ...dto } as any;

    if (dto.password) {
      const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
      updates.password = await bcrypt.hash(dto.password, saltRounds);
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = this.userRepo.findByEmail(dto.email);
      if (emailTaken) throw new ConflictException('Email already in use');
    }

    const updated = this.userRepo.updateById(id, updates);
    return this._sanitize(updated!);
  }

  delete(id: string, actorId: string): void {
    if (id === actorId) throw new ForbiddenException('Cannot delete your own account');
    const deleted = this.userRepo.deleteById(id);
    if (!deleted) throw new NotFoundException('Staff member not found');
    this.profileRepo.deleteByUserId(id);
  }

  search(query: string) {
    return this.userRepo.search(query).map((u) => this._sanitize(u));
  }

  filter(dto: StaffFilterDto) {
    return this.userRepo
      .filter({ department: dto.department, status: dto.status, role: dto.role })
      .map((u) => this._sanitize(u));
  }

  private _sanitize(user: any) {
    const { password, refreshToken, ...safe } = user;
    void password; void refreshToken;
    return safe;
  }

  private _generateEmployeeId(): string {
    const year = new Date().getFullYear();
    const count = this.userRepo.count() + 1;
    return `OZ-${year}-${String(count).padStart(4, '0')}`;
  }
}
