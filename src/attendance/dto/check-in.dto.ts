import { IsOptional, IsString, IsISO8601 } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsISO8601()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
