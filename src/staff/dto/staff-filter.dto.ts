import { IsOptional, IsEnum, IsString, MinLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class StaffSearchDto {
  @IsString()
  @MinLength(1)
  q: string;
}
