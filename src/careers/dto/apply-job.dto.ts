import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ApplyJobDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  @Transform(({ value }) => (value as string)?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  currentDesignation: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  education: string;

  @IsString()
  @IsNotEmpty()
  skills: string;

  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverLetter?: string;
}
