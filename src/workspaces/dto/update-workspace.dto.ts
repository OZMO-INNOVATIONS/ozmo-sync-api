import { IsString, IsOptional, IsEmail, IsEnum, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { WorkspacePlan } from '../../repositories/workspaces.repository';

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  domain?: string;

  @IsOptional()
  @IsEnum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
  plan?: WorkspacePlan;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (value as string)?.toLowerCase().trim())
  adminEmail?: string;
}
