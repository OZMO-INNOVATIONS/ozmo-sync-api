import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Role } from '../../common/constants/roles.enum';

export class RegisterNotificationsDto {
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

export class RegisterDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one number' })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  department?: string;

  // Workspace and Company fields
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  workspaceName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @IsOptional()
  @IsString()
  logo?: string;

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
  @Transform(({ value }) => value?.toLowerCase().trim())
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

  // Attendance and Settings fields
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

  // Notifications object
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RegisterNotificationsDto)
  notifications?: RegisterNotificationsDto;
}
