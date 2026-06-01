import { UserRepository } from '../repositories/user.repository';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { ExportQueryDto } from './dto/export-query.dto';
export declare class ReportsService {
    private readonly userRepo;
    private readonly attendanceRepo;
    private readonly auditRepo;
    constructor(userRepo: UserRepository, attendanceRepo: AttendanceRepository, auditRepo: AuditRepository);
    export(query: ExportQueryDto): {
        content: string;
        filename: string;
        mimeType: string;
    };
    private _gatherRows;
    private _employeeRows;
    private _attendanceRows;
    private _auditRows;
    private _toCSV;
    private _toPlainText;
}
