import { IsJWT, IsNotEmpty } from 'class-validator';

/**
 * DTO for POST /api/v1/auth/refresh
 */
export class RefreshTokenDto {
  @IsJWT({ message: 'Invalid refresh token format' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}
