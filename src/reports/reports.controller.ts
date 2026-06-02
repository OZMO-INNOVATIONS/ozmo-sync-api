import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ExportQueryDto } from './dto/export-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';

@Controller({ path: 'reports', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.HR, Role.SUPER_ADMIN)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('export')
  exportData(
    @Query() query: ExportQueryDto,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ) {
    const { content, filename, mimeType } = this.reportsService.export(query);

    this.auditService.log({
      action: 'DATA_EXPORTED',
      entityType: query.module,
      actorId: user.id,
      actorName: user.email,
      detail: `Exported ${query.module} as ${query.format} — ${filename}`,
    });

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }
}
