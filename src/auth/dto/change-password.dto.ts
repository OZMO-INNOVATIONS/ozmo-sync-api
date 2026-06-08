import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/[A-Z]/, { message: 'newPassword must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'newPassword must contain at least one number' })
  newPassword: string;
}
