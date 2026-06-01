import { SystemSettingsRepository } from '../repositories/system-settings.repository';
import { AuditService } from '../audit/audit.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';
export declare class SystemSettingsService {
    private readonly settingsRepo;
    private readonly auditService;
    constructor(settingsRepo: SystemSettingsRepository, auditService: AuditService);
    getSettings(): import("../repositories/system-settings.repository").SystemSettingsEntity;
    updateSettings(dto: UpdateSettingsDto, actor: RequestUser): {
        updatedAt: string;
    };
}
