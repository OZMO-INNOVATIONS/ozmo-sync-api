import { Module } from '@nestjs/common';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';
import { SystemSettingsRepository } from '../repositories/system-settings.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService, SystemSettingsRepository],
})
export class SystemSettingsModule {}
