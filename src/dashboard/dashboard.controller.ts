import { Controller, Get, UseGuards, NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'dashboard', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.HR, Role.TEAM_LEAD)
  async getAdminStats(@CurrentUser() user: RequestUser) {
    if (!user.workspaceId) {
      throw new NotFoundException('No active workspace context');
    }
    const data = await this.dashboardService.getAdminDashboardStats(user.workspaceId);
    return { message: 'Admin dashboard statistics retrieved successfully', data };
  }

  @Get('staff')
  async getStaffStats(@CurrentUser() user: RequestUser) {
    const data = await this.dashboardService.getStaffDashboardStats(user.id);
    return { message: 'Staff dashboard statistics retrieved successfully', data };
  }
}
