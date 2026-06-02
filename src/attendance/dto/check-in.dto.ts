import { IsOptional, IsString, IsISO8601 } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsISO8601()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
