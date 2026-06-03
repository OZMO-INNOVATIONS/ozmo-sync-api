import { IsOptional, IsString, IsInt, IsISO8601, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ActivityQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsISO8601()
  before?: string;

  @IsOptional()
  @IsString()
  types?: string;
}
