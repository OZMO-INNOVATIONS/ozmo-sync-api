declare class BrandingDto {
    appName?: string;
    slogan?: string;
}
declare class ModulesDto {
    payroll?: boolean;
    recruitment?: boolean;
    projectManagement?: boolean;
    assetManagement?: boolean;
    crm?: boolean;
    aiAnalytics?: boolean;
}
declare class SecurityDto {
    twoFactorRequired?: boolean;
    ssoEnabled?: boolean;
    deviceTracking?: boolean;
    auditLogging?: boolean;
    sessionTimeoutMinutes?: number;
}
declare class NotificationsDto {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    weeklyDigestEnabled?: boolean;
    securityAlertsEnabled?: boolean;
}
export declare class UpdateSettingsDto {
    branding?: BrandingDto;
    modules?: ModulesDto;
    security?: SecurityDto;
    notifications?: NotificationsDto;
}
export {};
