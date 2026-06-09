import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'meetings', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  async getMeetings(@CurrentUser() user: RequestUser) {
    const data = await this.meetingsService.findAll(user.workspaceId);
    return { message: 'Meetings fetched successfully', data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER, Role.SUPER_ADMIN)
  async createMeeting(@CurrentUser() user: RequestUser, @Body() dto: CreateMeetingDto) {
    const data = await this.meetingsService.create(user.workspaceId, dto);
    return { message: 'Meeting created successfully', data };
  }
}
