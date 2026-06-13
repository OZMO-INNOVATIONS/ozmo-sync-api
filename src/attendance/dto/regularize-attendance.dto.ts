import { IsNotEmpty, IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';

export class RegularizeAttendanceDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsEnum(['CHECK_IN', 'CHECK_OUT', 'BOTH'])
  type: 'CHECK_IN' | 'CHECK_OUT' | 'BOTH';

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class ReviewRegularizationDto {
  @IsNotEmpty()
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
