import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRepository, UserEntity } from '../repositories/user.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly userRepo: UserRepository) {}

  getProfile(userId: string) {
    const user = this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return this._sanitize(user);
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = this.userRepo.updateById(userId, dto);
    if (!updated) throw new NotFoundException('User not found');
    return this._sanitize(updated);
  }

  listUsers() {
    return this.userRepo.findAll().map((u) => this._sanitize(u));
  }

  getUserById(id: string) {
    const user = this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this._sanitize(user);
  }

  deleteUser(id: string, actorId: string): void {
    if (id === actorId) {
      throw new ForbiddenException('Cannot delete your own account');
    }
    const deleted = this.userRepo.deleteById(id);
    if (!deleted) throw new NotFoundException('User not found');
  }

  private _sanitize(user: UserEntity) {
    const { password, refreshToken, ...safe } = user;
    void password; void refreshToken;
    return safe;
  }
}
