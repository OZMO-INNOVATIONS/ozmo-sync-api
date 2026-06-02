import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

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

const DEFAULT_SETTINGS: Omit<SystemSettingsEntity, 'id'> = {
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

@Injectable()
export class SystemSettingsRepository {
  private settings: SystemSettingsEntity = {
    ...DEFAULT_SETTINGS,
    id: uuidv4(),
  };

  get(): SystemSettingsEntity {
    return this.settings;
  }

  update(
    patches: {
      branding?: Partial<BrandingSettings>;
      modules?: Partial<ModuleSettings>;
      security?: Partial<SecuritySettings>;
      notifications?: Partial<NotificationSettings>;
    },
    updatedBy?: string,
  ): SystemSettingsEntity {
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
}
