import { Controller, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';

@Controller({ version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('profile')
  async getOwnProfile(@CurrentUser() user: RequestUser) {
    const data = await this.profileService.getProfile(user.id);
    if (data) {
      data.role = user.role;
    }
    return { message: 'Profile fetched successfully', data };
  }

  @Put('profile')
  async updateOwnProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateProfileDto) {
    const data = await this.profileService.updateProfile(user.id, user.role, dto);
    return { message: 'Profile updated successfully', data };
  }

  @Get('users')
  @Roles(Role.ADMIN, Role.HR)
  async listUsers() {
    const data = await this.profileService.listUsers();
    return { message: 'Users fetched successfully', data };
  }

  @Get('users/:id')
  @Roles(Role.ADMIN, Role.HR)
  async getUserById(@Param('id') id: string) {
    const data = await this.profileService.getUserById(id);
    return { message: 'User fetched successfully', data };
  }

  @Delete('users/:id')
  @Roles(Role.ADMIN)
  async deleteUser(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.profileService.deleteUser(id, user.id);
    return { message: 'User deleted successfully', data: {} };
  }
}
