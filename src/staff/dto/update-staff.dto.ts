import { IsOptional, IsEnum, IsString, IsISO8601 } from 'class-validator';
import { Role, UserStatus } from '../../common/constants/roles.enum';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsISO8601()
  joiningDate?: string;
}
