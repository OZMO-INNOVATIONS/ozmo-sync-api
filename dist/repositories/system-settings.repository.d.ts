export interface BrandingSettings {
    appName: string;
    slogan: string;
    logoUrl: string | null;
    primaryColor: string;
}
export interface ModuleSettings {
    payroll: boolean;
    recruitment: boolean;
    projectManagement: boolean;
    assetManagement: boolean;
    crm: boolean;
    aiAnalytics: boolean;
}
export interface SecuritySettings {
    twoFactorRequired: boolean;
    ssoEnabled: boolean;
    deviceTracking: boolean;
    auditLogging: boolean;
    sessionTimeoutMinutes: number;
    allowedIpRanges: string[];
}
export interface NotificationSettings {
    emailEnabled: boolean;
    pushEnabled: boolean;
    weeklyDigestEnabled: boolean;
    securityAlertsEnabled: boolean;
}
export interface SystemSettingsEntity {
    id: string;
    branding: BrandingSettings;
    modules: ModuleSettings;
    security: SecuritySettings;
    notifications: NotificationSettings;
    updatedAt: string;
    updatedBy?: string;
}
export declare class SystemSettingsRepository {
    private settings;
    get(): SystemSettingsEntity;
    update(patches: {
        branding?: Partial<BrandingSettings>;
        modules?: Partial<ModuleSettings>;
        security?: Partial<SecuritySettings>;
        notifications?: Partial<NotificationSettings>;
    }, updatedBy?: string): SystemSettingsEntity;
}
