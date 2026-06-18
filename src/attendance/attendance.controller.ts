import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { GPSCheckInDto, GPSCheckOutDto } from './dto/gps-check-in.dto';
import { FaceCheckInDto, FaceCheckOutDto } from './dto/face-check-in.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { RegularizeAttendanceDto, ReviewRegularizationDto } from './dto/regularize-attendance.dto';
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
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async checkIn(@CurrentUser() user: RequestUser, @Body() dto: CheckInDto, @Req() req: Request) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '';
    const data = await this.attendanceService.checkIn(user.id, dto, clientIp);
    return { message: 'Check-in recorded', data };
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async checkOut(@CurrentUser() user: RequestUser, @Body() dto: CheckOutDto, @Req() req: Request) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '';
    const data = await this.attendanceService.checkOut(user.id, dto, clientIp);
    return { message: 'Check-out recorded', data };
  }

  @Post('check-in/wifi')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async checkInWifi(@CurrentUser() user: RequestUser, @Body() dto: CheckInDto, @Req() req: Request) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '';
    const localIps = (req.headers['x-local-ips'] as string) || '';
    const data = await this.attendanceService.checkInWifi(user.id, dto, clientIp, localIps);
    return { message: 'Check-in recorded via WiFi', data };
  }

  @Post('check-out/wifi')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async checkOutWifi(@CurrentUser() user: RequestUser, @Body() dto: CheckOutDto, @Req() req: Request) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '';
    const localIps = (req.headers['x-local-ips'] as string) || '';
    const data = await this.attendanceService.checkOutWifi(user.id, dto, clientIp, localIps);
    return { message: 'Check-out recorded via WiFi', data };
  }

  @Post('check-in/location')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async checkInLocation(@CurrentUser() user: RequestUser, @Body() dto: GPSCheckInDto) {
    const data = await this.attendanceService.checkInLocation(user.id, dto);
    return { message: 'Check-in recorded via GPS Location', data };
  }

  @Post('check-out/location')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async checkOutLocation(@CurrentUser() user: RequestUser, @Body() dto: GPSCheckOutDto) {
    const data = await this.attendanceService.checkOutLocation(user.id, dto);
    return { message: 'Check-out recorded via GPS Location', data };
  }

  @Post('check-in/face-id')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async checkInFace(@CurrentUser() user: RequestUser, @Body() dto: FaceCheckInDto) {
    const data = await this.attendanceService.checkInFace(user.id, dto);
    return { message: 'Check-in recorded via Face ID', data };
  }

  @Post('check-out/face-id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async checkOutFace(@CurrentUser() user: RequestUser, @Body() dto: FaceCheckOutDto) {
    const data = await this.attendanceService.checkOutFace(user.id, dto);
    return { message: 'Check-out recorded via Face ID', data };
  }

  @Get('today')
  async getTodayAttendance(@CurrentUser() user: RequestUser) {
    const data = await this.attendanceService.getTodayAttendance(user.id);
    return { message: 'Today attendance fetched', data };
  }

  @Get('status')
  async getStatus(@CurrentUser() user: RequestUser) {
    const data = await this.attendanceService.getStatus(user.id);
    return { message: 'Attendance status fetched', data };
  }

  @Get(['my', 'history'])
  async getMyAttendance(
    @CurrentUser() user: RequestUser,
    @Query() query: AttendanceQueryDto,
  ) {
    const data = await this.attendanceService.getAttendanceHistory(user.id, query);
    return { message: 'Attendance history fetched', data };
  }

  @Get('summary')
  async getAttendanceSummary(
    @CurrentUser() user: RequestUser,
    @Query() query: AttendanceQueryDto,
  ) {
    const data = await this.attendanceService.getAttendanceSummary(user.id, query);
    return { message: 'Attendance summary fetched', data };
  }

  @Get('daily-summary')
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async getDailySummary(@CurrentUser() user: RequestUser) {
    const data = await this.attendanceService.getDailySummary(user.id);
    return { message: 'Daily summary fetched', data };
  }

  @Get('weekly-summary')
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async getWeeklySummary(@CurrentUser() user: RequestUser) {
    const data = await this.attendanceService.getWeeklySummary(user.id);
    return { message: 'Weekly summary fetched', data };
  }

  @Get('monthly-summary')
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async getMonthlySummary(@CurrentUser() user: RequestUser) {
    const data = await this.attendanceService.getMonthlySummary(user.id);
    return { message: 'Monthly summary fetched', data };
  }


  @Get('monthly-report')
  async getMonthlyReport(
    @CurrentUser() user: RequestUser,
    @Query() query: AttendanceQueryDto,
  ) {
    const data = await this.attendanceService.getMonthlyReport(user.id, query);
    return { message: 'Monthly report fetched', data };
  }

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.HR, Role.TEAM_LEAD)
  async getDashboard(@Query() query: AttendanceQueryDto) {
    const data = await this.attendanceService.getDashboard(query);
    return { message: 'Dashboard data fetched', data };
  }

  @Post('regularize')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async submitRegularization(
    @CurrentUser() user: RequestUser,
    @Body() dto: RegularizeAttendanceDto,
  ) {
    const data = await this.attendanceService.submitRegularization(user.id, dto);
    return { message: 'Regularization request submitted successfully', data };
  }

  // ── Correction alias endpoints (frontend-facing) ──────────────────────────
  // Maps frontend /attendance/correction payload to the regularize logic.

  @Post('correction')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async submitCorrection(
    @CurrentUser() user: RequestUser,
    @Body() body: {
      date: string;
      checkInTime?: string;
      checkOutTime?: string;
      requestedCheckIn?: string;
      requestedCheckOut?: string;
      reason: string;
    },
  ) {
    // Resolve check-in/out from either camelCase or requestedXxx forms
    const checkIn = body.checkInTime || body.requestedCheckIn;
    const checkOut = body.checkOutTime || body.requestedCheckOut;

    // Normalise time-only strings ("09:00:00") to full ISO datetime using the given date
    const normalise = (timeOrIso?: string): string | undefined => {
      if (!timeOrIso) return undefined;
      // Already a full ISO string
      if (timeOrIso.includes('T') || timeOrIso.includes('-')) return timeOrIso;
      // Time-only: combine with date
      return `${body.date}T${timeOrIso}Z`;
    };

    const normCheckIn = normalise(checkIn);
    const normCheckOut = normalise(checkOut);

    let type: 'CHECK_IN' | 'CHECK_OUT' | 'BOTH';
    if (normCheckIn && normCheckOut) type = 'BOTH';
    else if (normCheckIn) type = 'CHECK_IN';
    else type = 'CHECK_OUT';

    const dto: RegularizeAttendanceDto = {
      date: body.date,
      type,
      checkIn: normCheckIn,
      checkOut: normCheckOut,
      reason: body.reason,
    };

    const data = await this.attendanceService.submitRegularization(user.id, dto);
    return { message: 'Correction request submitted', data };
  }

  @Get(['regularizations', 'corrections'])
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async listRegularizations(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
  ) {
    const data = await this.attendanceService.getRegularizations(
      user.id,
      user.role,
      user.workspaceId || '',
      status,
    );
    return { message: 'Regularization requests fetched successfully', data };
  }

  @Get(':userId')
  @Roles(Role.ADMIN, Role.HR, Role.TEAM_LEAD)
  async getUserAttendance(
    @Param('userId') userId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    const data = await this.attendanceService.getAttendanceHistory(userId, query);
    return { message: 'Attendance history fetched', data };
  }

  @Put('regularize/:id/action')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.HR, Role.TEAM_LEAD)
  async actionRegularization(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: ReviewRegularizationDto,
  ) {
    const data = await this.attendanceService.actionRegularization(
      id,
      user.id,
      dto.status,
      dto.rejectionReason,
    );
    return { message: `Regularization request ${dto.status.toLowerCase()} successfully`, data };
  }
}
