import { Controller, Get, Post, Put, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { SubmitLeaveDto } from './dto/submit-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'leaves', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get()
  async getLeaves(@CurrentUser() user: RequestUser) {
    const data = await this.leavesService.findAll(user.workspaceId, user.id, user.role);
    return { message: 'Leaves fetched successfully', data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitLeave(@CurrentUser() user: RequestUser, @Body() dto: SubmitLeaveDto) {
    const data = await this.leavesService.create(user.workspaceId, user.id, dto);
    return { message: 'Leave request submitted successfully', data };
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.HR, Role.MANAGER, Role.TEAM_LEAD)
  async updateLeaveStatus(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateLeaveStatusDto,
  ) {
    const data = await this.leavesService.updateStatus(id, user.workspaceId, dto);
    return { message: 'Leave status updated successfully', data };
  }
}
