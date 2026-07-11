import { IsString, IsOptional, MinLength, MaxLength, IsEmail, IsEnum, Matches, ValidateIf } from 'class-validator';
import { Role } from '../../common/constants/roles.enum';

export class UpdateProfileDto {
  @IsOptional()
  @ValidateIf((o, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  @Matches(/^\+?[\d\s\-()]{10,20}$/, { message: 'Phone number must be a valid format (10-20 digits/symbols)' })
  phone?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  @Matches(/^\+?[\d\s\-()]{10,20}$/, { message: 'Emergency contact must be a valid format (10-20 digits/symbols)' })
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  // Restricted fields
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  joiningDate?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  workspaceName?: string;
}
