import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'invitations', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInvitation(@Body() dto: CreateInvitationDto, @CurrentUser() admin: RequestUser) {
    const data = await this.invitationsService.createInvitation(dto, admin);
    return { message: 'Invitation sent successfully', data };
  }

  @Get()
  async listInvitations(@CurrentUser() admin: RequestUser) {
    const data = await this.invitationsService.listInvitations(admin);
    return { message: 'Invitations retrieved successfully', data };
  }

  @Post(':token/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeInvitation(@Param('token') token: string, @CurrentUser() admin: RequestUser) {
    const data = await this.invitationsService.revokeInvitation(token, admin);
    return { message: 'Invitation revoked successfully', data };
  }
}
