import { SystemSettingsService } from './system-settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';
export declare class SystemSettingsController {
    private readonly settingsService;
    constructor(settingsService: SystemSettingsService);
    getSettings(): {
        message: string;
        data: import("../repositories/system-settings.repository").SystemSettingsEntity;
    };
    updateSettings(dto: UpdateSettingsDto, user: RequestUser): {
        message: string;
        data: {
            updatedAt: string;
        };
    };
}
