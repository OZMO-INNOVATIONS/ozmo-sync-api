import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

const SINGLETON_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class SystemSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(settings: any): SystemSettingsEntity {
    return {
      id: settings.id,
      branding: settings.branding as unknown as BrandingSettings,
      modules: settings.modules as unknown as ModuleSettings,
      security: settings.security as unknown as SecuritySettings,
      notifications: settings.notifications as unknown as NotificationSettings,
      updatedAt: settings.updatedAt.toISOString(),
      updatedBy: settings.updatedBy ?? undefined,
    };
  }

  async get(): Promise<SystemSettingsEntity> {
    let settings = await this.prisma.systemSettings.findUnique({
      where: { id: SINGLETON_ID },
    });

    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          id: SINGLETON_ID,
          branding: DEFAULT_SETTINGS.branding as any,
          modules: DEFAULT_SETTINGS.modules as any,
          security: DEFAULT_SETTINGS.security as any,
          notifications: DEFAULT_SETTINGS.notifications as any,
        },
      });
    }

    return this.mapToEntity(settings);
  }

  async update(
    patches: {
      branding?: Partial<BrandingSettings>;
      modules?: Partial<ModuleSettings>;
      security?: Partial<SecuritySettings>;
      notifications?: Partial<NotificationSettings>;
    },
    updatedBy?: string,
  ): Promise<SystemSettingsEntity> {
    const current = await this.get();

    const updatedBranding = patches.branding
      ? { ...current.branding, ...patches.branding }
      : current.branding;
    const updatedModules = patches.modules
      ? { ...current.modules, ...patches.modules }
      : current.modules;
    const updatedSecurity = patches.security
      ? { ...current.security, ...patches.security }
      : current.security;
    const updatedNotifications = patches.notifications
      ? { ...current.notifications, ...patches.notifications }
      : current.notifications;

    const settings = await this.prisma.systemSettings.update({
      where: { id: SINGLETON_ID },
      data: {
        branding: updatedBranding as any,
        modules: updatedModules as any,
        security: updatedSecurity as any,
        notifications: updatedNotifications as any,
        updatedBy: updatedBy ?? current.updatedBy,
      },
    });

    return this.mapToEntity(settings);
  }
}
