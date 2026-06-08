import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangeInitialPasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'newPassword must be at least 8 characters long' })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
