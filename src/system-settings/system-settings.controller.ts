import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'admin/settings', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get()
  getSettings() {
    const data = this.settingsService.getSettings();
    return { message: 'System settings retrieved', data };
  }

  @Put()
  updateSettings(@Body() dto: UpdateSettingsDto, @CurrentUser() user: RequestUser) {
    const data = this.settingsService.updateSettings(dto, user);
    return { message: 'System settings updated successfully', data };
  }
}
