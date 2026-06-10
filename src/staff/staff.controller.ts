import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffFilterDto, StaffSearchDto } from './dto/staff-filter.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'staff', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.HR)
  async createStaff(@Body() dto: CreateStaffDto, @CurrentUser() actor: RequestUser) {
    const data = await this.staffService.create(dto, actor);
    return { message: 'Staff Created Successfully', data };
  }

  @Get()
  @Roles(Role.ADMIN, Role.HR)
  async listStaff(@Query() query: StaffFilterDto) {
    const data = await this.staffService.findAll(query);
    return { message: 'Staff list fetched', data };
  }

  // /search and /filter must be declared BEFORE /:id to avoid shadowing
  @Get('search')
  @Roles(Role.ADMIN, Role.HR)
  async searchStaff(@Query() query: StaffSearchDto) {
    const data = await this.staffService.search(query.q);
    return { message: 'Search results', data };
  }

  @Get('filter')
  @Roles(Role.ADMIN, Role.HR)
  async filterStaff(@Query() dto: StaffFilterDto) {
    const data = await this.staffService.filter(dto);
    return { message: 'Filtered results', data };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HR, Role.TEAM_LEAD)
  async getStaffById(@Param('id') id: string) {
    const data = await this.staffService.findById(id);
    return { message: 'Staff member fetched', data };
  }
  @Put(':id')
  @Roles(Role.ADMIN, Role.HR)
  async updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto, @CurrentUser() actor: RequestUser) {
    const data = await this.staffService.update(id, dto, actor);
    return { message: 'Staff member updated', data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteStaff(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    await this.staffService.delete(id, actor.id);
    return { message: 'Staff member deleted', data: {} };
  }
}
