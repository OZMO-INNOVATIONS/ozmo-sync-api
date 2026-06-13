import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InviteUserDto } from '../users/dto/invite-user.dto';
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
  async invite(@CurrentUser() user: RequestUser, @Body() dto: InviteUserDto) {
    const data = await this.invitationsService.createInvitation(dto, user);
    return { message: 'Invitation sent successfully', data };
  }

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    const data = await this.invitationsService.listInvitations(user);
    return { message: 'Invitations fetched successfully', data };
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  async revoke(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.invitationsService.cancelInvitation(id, user);
    return { message: 'Invitation revoked successfully', data };
  }
}
