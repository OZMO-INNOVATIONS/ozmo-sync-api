import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'audit', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getLogs(@Query() query: AuditQueryDto) {
    const data = await this.auditService.getLogs(query);
    return { message: 'Audit logs retrieved', data };
  }

  @Get(':entityId')
  async getEntityLog(@Param('entityId') entityId: string) {
    const data = await this.auditService.getEntityLog(entityId);
    return { message: 'Entity audit log retrieved', data };
  }
}
