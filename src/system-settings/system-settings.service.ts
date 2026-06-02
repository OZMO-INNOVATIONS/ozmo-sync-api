import { Injectable } from '@nestjs/common';
import { SystemSettingsRepository } from '../repositories/system-settings.repository';
import { AuditService } from '../audit/audit.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';

@Injectable()
export class SystemSettingsService {
  constructor(
    private readonly settingsRepo: SystemSettingsRepository,
    private readonly auditService: AuditService,
  ) {}

  getSettings() {
    return this.settingsRepo.get();
  }

  updateSettings(dto: UpdateSettingsDto, actor: RequestUser) {
    const current = this.settingsRepo.get();

    const updated = this.settingsRepo.update(
      {
        branding: dto.branding,
        modules: dto.modules,
        security: dto.security,
        notifications: dto.notifications,
      },
      actor.id,
    );

    const disabledAudit =
      current.security.auditLogging === true && dto.security?.auditLogging === false;

    this.auditService.log({
      action: 'SETTINGS_UPDATED',
      entityType: 'SYSTEM_SETTINGS',
      entityId: updated.id,
      actorId: actor.id,
      actorName: actor.email,
      detail: disabledAudit
        ? 'System settings updated — audit logging disabled'
        : 'System settings updated',
    });

    return { updatedAt: updated.updatedAt };
  }
}
