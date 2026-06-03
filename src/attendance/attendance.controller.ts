import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'attendance', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.STAFF, Role.TEAM_LEAD)
  async checkIn(@CurrentUser() user: RequestUser, @Body() dto: CheckInDto) {
    const data = await this.attendanceService.checkIn(user.id, dto);
    return { message: 'Check-in recorded', data };
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STAFF, Role.TEAM_LEAD)
  async checkOut(@CurrentUser() user: RequestUser, @Body() dto: CheckOutDto) {
    const data = await this.attendanceService.checkOut(user.id, dto);
    return { message: 'Check-out recorded', data };
  }

  // Declare /my and /dashboard BEFORE /:userId to prevent route shadowing
  @Get('my')
  async getMyAttendance(
    @CurrentUser() user: RequestUser,
    @Query() query: AttendanceQueryDto,
  ) {
    const data = await this.attendanceService.getAttendance(user.id, query);
    return { message: 'Attendance fetched', data };
  }

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  async getDashboard(@Query() query: AttendanceQueryDto) {
    const data = await this.attendanceService.getDashboard(query);
    return { message: 'Dashboard data fetched', data };
  }

  @Get(':userId')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  async getUserAttendance(
    @Param('userId') userId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    const data = await this.attendanceService.getAttendance(userId, query);
    return { message: 'Attendance fetched', data };
  }
}
