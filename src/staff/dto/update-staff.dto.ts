import { IsOptional, IsEnum, IsString, IsISO8601, Matches } from 'class-validator';
import { Role, UserStatus } from '../../common/constants/roles.enum';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits' })
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

  @IsOptional()
  @IsString()
  profilePhoto?: string;
}
