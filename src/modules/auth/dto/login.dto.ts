import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO for POST /api/v1/auth/login
 *
 * Validates that the request body contains a well-formed email and a non-empty
 * password.  Passwords must be at least 6 characters.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;
}
