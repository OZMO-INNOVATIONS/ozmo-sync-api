import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsISO8601,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../../common/constants/roles.enum';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one number' })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsISO8601()
  joiningDate?: string;
}
