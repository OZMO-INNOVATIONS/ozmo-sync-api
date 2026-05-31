import { IsOptional, IsEnum, IsString, MinLength } from 'class-validator';
import { Role, UserStatus } from '../../common/constants/roles.enum';

export class StaffFilterDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class StaffSearchDto {
  @IsString()
  @MinLength(1)
  q: string;
}
