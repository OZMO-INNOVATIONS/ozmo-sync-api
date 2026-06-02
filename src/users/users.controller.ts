import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AttendanceStatsQueryDto } from './dto/attendance-stats-query.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.HR, Role.MANAGER, Role.SUPER_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId/attendance-stats')
  getAttendanceStats(
    @Param('userId') userId: string,
    @Query() query: AttendanceStatsQueryDto,
  ) {
    const data = this.usersService.getAttendanceStats(userId, query);
    return { message: 'Attendance stats retrieved', data };
  }

  @Get(':userId/activity')
  getActivity(@Param('userId') userId: string, @Query() query: ActivityQueryDto) {
    const data = this.usersService.getActivity(userId, query);
    return { message: 'Activity log retrieved', data };
  }
}
