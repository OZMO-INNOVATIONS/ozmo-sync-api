import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRepository, UserEntity } from '../repositories/user.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly userRepo: UserRepository,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const sanitized = this._sanitize(user);

    return {
      ...sanitized,
      profilePhoto: user.profileImage ?? null,
      address: user.address ?? null,
      emergencyContact: user.emergencyContactName ? `${user.emergencyContactName} (${user.emergencyContactNumber ?? ''})` : null,
      bio: user.bio ?? null,
      skills: [],
    };
  }

  async updateProfile(userId: string, actorRole: string, dto: UpdateProfileDto) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const isAdmin = actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN' || actorRole === 'HR';
    if (!isAdmin) {
      const restricted = [
        'firstName',
        'lastName',
        'email',
        'role',
        'designation',
        'department',
        'employeeId',
        'joiningDate',
        'workspaceId',
        'workspaceName',
      ];
      for (const field of restricted) {
        if (dto[field as keyof UpdateProfileDto] !== undefined && dto[field as keyof UpdateProfileDto] !== (user as any)[field]) {
          throw new ForbiddenException(`You do not have permission to update restricted field: ${field}`);
        }
      }
    }

    const userUpdates: Partial<UserEntity> = {};
    if (dto.firstName !== undefined) userUpdates.firstName = dto.firstName;
    if (dto.lastName !== undefined) userUpdates.lastName = dto.lastName;
    if (dto.phone !== undefined) userUpdates.phone = dto.phone;
    if (dto.profilePhoto !== undefined) userUpdates.profileImage = dto.profilePhoto;
    if (dto.address !== undefined) userUpdates.address = dto.address;
    if (dto.bio !== undefined) userUpdates.bio = dto.bio;

    if (dto.emergencyContact !== undefined) {
      const match = dto.emergencyContact ? dto.emergencyContact.match(/^([^(]+)(?:\(([^)]+)\))?/) : null;
      if (match) {
        userUpdates.emergencyContactName = match[1].trim();
        userUpdates.emergencyContactNumber = match[2] ? match[2].trim() : '';
      } else {
        userUpdates.emergencyContactName = dto.emergencyContact || '';
        userUpdates.emergencyContactNumber = '';
      }
    }

    if (isAdmin) {
      if (dto.email !== undefined) userUpdates.email = dto.email;
      if (dto.role !== undefined) userUpdates.role = dto.role;
      if (dto.designation !== undefined) userUpdates.designation = dto.designation;
      if (dto.department !== undefined) userUpdates.department = dto.department;
      if (dto.joiningDate !== undefined) userUpdates.joiningDate = dto.joiningDate;
      if (dto.employeeId !== undefined) userUpdates.employeeId = dto.employeeId;
      if (dto.workspaceId !== undefined) userUpdates.workspaceId = dto.workspaceId;
      if (dto.workspaceName !== undefined) userUpdates.workspaceName = dto.workspaceName;
    }

    if (Object.keys(userUpdates).length > 0) {
      await this.userRepo.updateById(userId, userUpdates);
    }

    return this.getProfile(userId);
  }

  async listUsers() {
    const users = await this.userRepo.findAll();
    return users.map((u) => this._sanitize(u));
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this._sanitize(user);
  }

  async deleteUser(id: string, actorId: string): Promise<void> {
    if (id === actorId) {
      throw new ForbiddenException('Cannot delete your own account');
    }
    const deleted = await this.userRepo.deleteById(id);
    if (!deleted) throw new NotFoundException('User not found');
  }

  private _sanitize(user: UserEntity) {
    const { password, refreshToken, ...safe } = user;
    void password; void refreshToken;
    return safe;
  }
}
