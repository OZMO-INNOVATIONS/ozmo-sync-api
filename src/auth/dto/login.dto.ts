import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  employeeId?: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
