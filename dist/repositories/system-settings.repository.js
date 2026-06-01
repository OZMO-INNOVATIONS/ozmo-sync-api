"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettingsRepository = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const DEFAULT_SETTINGS = {
    branding: {
        appName: 'OZMO SYNC',
        slogan: 'Enterprise Workforce OS',
        logoUrl: null,
        primaryColor: '#2563EB',
    },
    modules: {
        payroll: false,
        recruitment: true,
        projectManagement: false,
        assetManagement: false,
        crm: false,
        aiAnalytics: false,
    },
    security: {
        twoFactorRequired: false,
        ssoEnabled: false,
        deviceTracking: true,
        auditLogging: true,
        sessionTimeoutMinutes: 60,
        allowedIpRanges: [],
    },
    notifications: {
        emailEnabled: true,
        pushEnabled: true,
        weeklyDigestEnabled: true,
        securityAlertsEnabled: true,
    },
    updatedAt: new Date().toISOString(),
};
let SystemSettingsRepository = class SystemSettingsRepository {
    constructor() {
        this.settings = {
            ...DEFAULT_SETTINGS,
            id: (0, uuid_1.v4)(),
        };
    }
    get() {
        return this.settings;
    }
    update(patches, updatedBy) {
        this.settings = {
            ...this.settings,
            branding: patches.branding
                ? { ...this.settings.branding, ...patches.branding }
                : this.settings.branding,
            modules: patches.modules
                ? { ...this.settings.modules, ...patches.modules }
                : this.settings.modules,
            security: patches.security
                ? { ...this.settings.security, ...patches.security }
                : this.settings.security,
            notifications: patches.notifications
                ? { ...this.settings.notifications, ...patches.notifications }
                : this.settings.notifications,
            updatedAt: new Date().toISOString(),
            updatedBy: updatedBy ?? this.settings.updatedBy,
        };
        return this.settings;
    }
};
exports.SystemSettingsRepository = SystemSettingsRepository;
exports.SystemSettingsRepository = SystemSettingsRepository = __decorate([
    (0, common_1.Injectable)()
], SystemSettingsRepository);
//# sourceMappingURL=system-settings.repository.js.map