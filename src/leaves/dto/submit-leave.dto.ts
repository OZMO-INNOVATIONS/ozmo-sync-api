import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsISO8601 } from 'class-validator';

export class SubmitLeaveDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  employeeName: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsString()
  @IsNotEmpty()
  category: string; // casual, sick, paid, compOff, wfh, halfDay

  @IsString()
  @IsNotEmpty()
  priority: string; // low, normal, high, urgent

  @IsISO8601()
  startDate: string;

  @IsISO8601()
  endDate: string;

  @IsNumber()
  days: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsBoolean()
  hasAttachment?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  impactLevel?: string;

  @IsOptional()
  @IsString()
  coverageStatus?: string;

  @IsOptional()
  @IsString()
  teamLeadNote?: string;

  @IsOptional()
  @IsISO8601()
  appliedAt?: string;
}
