import { IsString, IsNotEmpty, IsIn, IsOptional, IsISO8601 } from 'class-validator';

export class ExportQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['EMPLOYEES', 'ATTENDANCE', 'LEAVES', 'AUDIT', 'REFERRALS'])
  module: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['CSV', 'XLSX', 'PDF'])
  format: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsISO8601()
  fromDate?: string;

  @IsOptional()
  @IsISO8601()
  toDate?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
