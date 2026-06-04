import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
