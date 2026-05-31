import { IsString, IsIn, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../../common/decorators/roles.decorator';

/**
 * DTO for PATCH /api/v1/admin/users/:id/role
 */
export class UpdateRoleDto {
  @IsString({ message: 'Role must be a string' })
  @IsNotEmpty({ message: 'Role is required' })
  @IsIn(['user', 'admin', 'superadmin'] as const, {
    message: 'Role must be one of: user, admin, superadmin',
  })
  role!: UserRole;
}
