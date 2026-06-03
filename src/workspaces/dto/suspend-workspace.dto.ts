import { IsString, IsBoolean, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';

export class SuspendWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  reason: string;

  @IsOptional()
  @IsBoolean()
  notifyMembers?: boolean;
}
