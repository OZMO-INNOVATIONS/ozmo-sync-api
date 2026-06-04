import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { SuspendWorkspaceDto } from './dto/suspend-workspace.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'workspaces', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async listWorkspaces() {
    const data = await this.workspacesService.listWorkspaces();
    return { message: 'Workspaces retrieved', data };
  }

  @Get('my-workspace')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getMyWorkspaceDetails(@CurrentUser() user: RequestUser) {
    const data = await this.workspacesService.getWorkspaceDetailsByAdmin(user.email);
    return { message: 'Workspace details with associated data retrieved successfully', data };
  }

  @Get(':id')
  async getWorkspace(@Param('id') id: string) {
    const data = await this.workspacesService.getWorkspace(id);
    return { message: 'Workspace retrieved', data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWorkspace(@Body() dto: CreateWorkspaceDto, @CurrentUser() user: RequestUser) {
    const data = await this.workspacesService.createWorkspace(dto, user);
    return { message: 'Workspace created', data };
  }

  @Put(':id')
  async updateWorkspace(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.workspacesService.updateWorkspace(id, dto, user);
    return { message: 'Workspace updated', data };
  }

  @Put(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendWorkspace(
    @Param('id') id: string,
    @Body() dto: SuspendWorkspaceDto,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.workspacesService.suspendWorkspace(id, dto, user);
    return { message: 'Workspace suspended successfully', data };
  }

  @Put(':id/unsuspend')
  @HttpCode(HttpStatus.OK)
  async unsuspendWorkspace(
    @Param('id') id: string,
    @Body() dto: SuspendWorkspaceDto,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.workspacesService.unsuspendWorkspace(id, dto, user);
    return { message: 'Workspace reinstated successfully', data };
  }
}
