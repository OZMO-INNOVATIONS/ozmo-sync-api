import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ExportQueryDto } from './dto/export-query.dto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/interfaces/request-user.interface';
export declare class ReportsController {
    private readonly reportsService;
    private readonly auditService;
    constructor(reportsService: ReportsService, auditService: AuditService);
    exportData(query: ExportQueryDto, user: RequestUser, res: Response): void;
}
