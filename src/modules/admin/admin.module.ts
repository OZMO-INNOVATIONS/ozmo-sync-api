import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';

/**
 * AdminModule — exposes admin-only user management endpoints.
 *
 * All routes are protected by the global JwtAuthGuard + the RolesGuard,
 * which reads the @Roles decorator on the controller.
 *
 * --- Migration to Prisma ---
 *  No changes needed — this module depends only on UsersService.
 */
@Module({
  imports: [UsersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
