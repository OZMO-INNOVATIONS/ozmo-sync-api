import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsObject,
  ValidateNested,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class BrandingDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  appName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slogan?: string;
}

class ModulesDto {
  @IsOptional() @IsBoolean() payroll?: boolean;
  @IsOptional() @IsBoolean() recruitment?: boolean;
  @IsOptional() @IsBoolean() projectManagement?: boolean;
  @IsOptional() @IsBoolean() assetManagement?: boolean;
  @IsOptional() @IsBoolean() crm?: boolean;
  @IsOptional() @IsBoolean() aiAnalytics?: boolean;
}

class SecurityDto {
  @IsOptional() @IsBoolean() twoFactorRequired?: boolean;
  @IsOptional() @IsBoolean() ssoEnabled?: boolean;
  @IsOptional() @IsBoolean() deviceTracking?: boolean;
  @IsOptional() @IsBoolean() auditLogging?: boolean;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  sessionTimeoutMinutes?: number;
}

class NotificationsDto {
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsBoolean() weeklyDigestEnabled?: boolean;
  @IsOptional() @IsBoolean() securityAlertsEnabled?: boolean;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BrandingDto)
  branding?: BrandingDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ModulesDto)
  modules?: ModulesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SecurityDto)
  security?: SecurityDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationsDto)
  notifications?: NotificationsDto;
}
