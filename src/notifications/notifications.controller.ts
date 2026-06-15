import { Controller, Get, Patch, Post, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';

@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@CurrentUser() user: RequestUser) {
    const data = await this.notificationsService.findAll(user.id);
    return { message: 'Notifications fetched successfully', data };
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.notificationsService.markRead(user.id, id);
    return { message: 'Notification marked as read', data };
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: RequestUser) {
    const data = await this.notificationsService.markAllRead(user.id);
    return { message: 'All notifications marked as read', data };
  }
}
