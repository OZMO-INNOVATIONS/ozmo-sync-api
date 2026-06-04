import { IsString, IsOptional, IsEmail, IsEnum, MaxLength, IsBoolean, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { WorkspacePlan } from '../../repositories/workspaces.repository';

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  domain?: string;

  @IsOptional()
  @IsEnum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
  plan?: WorkspacePlan;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (value as string)?.toLowerCase().trim())
  adminEmail?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industryType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  companySize?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (value as string)?.toLowerCase().trim())
  companyEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  companyPhone?: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsOptional()
  @IsString()
  companyDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  attendanceMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  defaultWorkingHours?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weekendDays?: string[];

  @IsOptional()
  @IsString()
  leavePolicy?: string;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  attendanceAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  leaveAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  taskAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  birthdayAlerts?: boolean;
}
