import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRepository, UserEntity } from '../repositories/user.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly userRepo: UserRepository) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return this._sanitize(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.userRepo.updateById(userId, dto);
    if (!updated) throw new NotFoundException('User not found');
    return this._sanitize(updated);
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
