import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { InvitationsService } from '../invitations/invitations.service';
import { AttendanceStatsQueryDto } from './dto/attendance-stats-query.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';

@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.HR, Role.MANAGER, Role.SUPER_ADMIN)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @Get(':userId/attendance-stats')
  async getAttendanceStats(
    @Param('userId') userId: string,
    @Query() query: AttendanceStatsQueryDto,
  ) {
    const data = await this.usersService.getAttendanceStats(userId, query);
    return { message: 'Attendance stats retrieved', data };
  }

  @Get(':userId/activity')
  async getActivity(@Param('userId') userId: string, @Query() query: ActivityQueryDto) {
    const data = await this.usersService.getActivity(userId, query);
    return { message: 'Activity log retrieved', data };
  }

  @Post('invite')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async invite(@Body() dto: InviteUserDto, @CurrentUser() admin: RequestUser) {
    const data = await this.invitationsService.createInvitation(dto, admin);
    return { message: 'Invitation sent successfully', data };
  }

  @Public()
  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    const data = await this.invitationsService.acceptInvitation(dto);
    return data;
  }

  @Post('resend-invite/:invitationId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async resendInvite(
    @Param('invitationId') invitationId: string,
    @CurrentUser() admin: RequestUser,
  ) {
    await this.invitationsService.resendInvitation(invitationId, admin);
    return { message: 'Invitation resent successfully' };
  }

  @Delete('invite/:invitationId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async cancelInvite(
    @Param('invitationId') invitationId: string,
    @CurrentUser() admin: RequestUser,
  ) {
    await this.invitationsService.cancelInvitation(invitationId, admin);
    return { message: 'Invitation cancelled successfully' };
  }
}
