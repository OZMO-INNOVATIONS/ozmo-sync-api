import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateLeaveStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  rejectedBy?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
