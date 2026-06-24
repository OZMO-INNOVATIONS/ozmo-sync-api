import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEnum,
  IsISO8601,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../../common/constants/roles.enum';

export class CreateStaffDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'temporaryPassword must be at least 8 characters long' })
  temporaryPassword?: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits' })
  phone?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsISO8601()
  joiningDate?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;
}
