import { IsOptional, IsString, IsISO8601 } from 'class-validator';

export class CheckOutDto {
  @IsOptional()
  @IsISO8601()
  checkOutTime?: string;

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
