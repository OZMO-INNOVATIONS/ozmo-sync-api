import { IsOptional, IsString, IsNotEmpty, IsISO8601 } from 'class-validator';

export class AdminOverrideDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsISO8601()
  date: string;

  @IsOptional()
  @IsISO8601()
  checkIn?: string;

  @IsOptional()
  @IsISO8601()
  checkOut?: string;
}
