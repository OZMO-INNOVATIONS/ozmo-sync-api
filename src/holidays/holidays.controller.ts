import { Controller, Get, UseGuards } from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';

@Controller({ path: 'holidays', version: '1' })
@UseGuards(JwtAuthGuard)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  async getHolidays(@CurrentUser() user: RequestUser) {
    const data = await this.holidaysService.findAll(user.workspaceId || '');
    return { message: 'Holidays fetched successfully', data };
  }
}
