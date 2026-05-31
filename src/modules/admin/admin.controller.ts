import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UpdateRoleDto } from '../auth/dto/update-role.dto';

/**
 * AdminController
 *
 * Admin-only endpoints under /api/v1/admin.
 * All routes require authentication + admin or superadmin role.
 *
 * Base path: /api/v1/admin
 */
@Controller('admin')
@Roles('admin', 'superadmin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── List users ──────────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/users
   *
   * Returns all registered users (passwords excluded).
   */
  @Get('users')
  @HttpCode(HttpStatus.OK)
  getAllUsers() {
    const users = this.adminService.getAllUsers();
    return {
      message: 'Users retrieved successfully',
      data: { users, total: users.length },
    };
  }

  // ─── Block user ──────────────────────────────────────────────────────────

  /**
   * PATCH /api/v1/admin/users/:id/block
   */
  @Patch('users/:id/block')
  @HttpCode(HttpStatus.OK)
  blockUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const updatedUser = this.adminService.blockUser(id, user.sub);
    return {
      message: 'User blocked successfully',
      data: updatedUser,
    };
  }

  // ─── Unblock user ────────────────────────────────────────────────────────

  /**
   * PATCH /api/v1/admin/users/:id/unblock
   */
  @Patch('users/:id/unblock')
  @HttpCode(HttpStatus.OK)
  unblockUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const updatedUser = this.adminService.unblockUser(id, user.sub);
    return {
      message: 'User unblocked successfully',
      data: updatedUser,
    };
  }

  // ─── Update role ─────────────────────────────────────────────────────────

  /**
   * PATCH /api/v1/admin/users/:id/role
   */
  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const updatedUser = this.adminService.updateRole(
      id,
      dto.role,
      user.role,
      user.sub,
    );
    return {
      message: 'User role updated successfully',
      data: updatedUser,
    };
  }
}
