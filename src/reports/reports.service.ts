import { Injectable, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { ExportQueryDto } from './dto/export-query.dto';

type Row = Record<string, string | number | null | undefined>;

@Injectable()
export class ReportsService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly attendanceRepo: AttendanceRepository,
    private readonly auditRepo: AuditRepository,
  ) {}

  export(query: ExportQueryDto): { content: string; filename: string; mimeType: string } {
    if (query.fromDate && query.toDate) {
      const from = new Date(query.fromDate);
      const to = new Date(query.toDate);
      const diffMs = to.getTime() - from.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > 366) {
        throw new BadRequestException('Date range cannot exceed 12 months');
      }
    }

    const rows = this._gatherRows(query);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const moduleName = query.module.toLowerCase();

    let content: string;
    let mimeType: string;
    let ext: string;

    switch (query.format) {
      case 'CSV':
        content = this._toCSV(rows);
        mimeType = 'text/csv';
        ext = 'csv';
        break;
      case 'XLSX':
        // Generate minimal XLSX-compatible CSV (proper XLSX requires exceljs)
        content = this._toCSV(rows);
        mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        ext = 'xlsx';
        break;
      case 'PDF':
        // Generate plain-text PDF-like representation (proper PDF requires pdfkit)
        content = this._toPlainText(rows, query.module);
        mimeType = 'application/pdf';
        ext = 'pdf';
        break;
      default:
        throw new BadRequestException('Invalid format');
    }

    return {
      content,
      filename: `ozmo_${moduleName}_${dateStamp}.${ext}`,
      mimeType,
    };
  }

  private _gatherRows(query: ExportQueryDto): Row[] {
    const from = query.fromDate ? new Date(query.fromDate) : undefined;
    const to = query.toDate ? new Date(query.toDate) : undefined;

    switch (query.module) {
      case 'EMPLOYEES':
        return this._employeeRows(query.department, query.status);
      case 'ATTENDANCE':
        return this._attendanceRows(from, to);
      case 'AUDIT':
        return this._auditRows(from, to);
      default:
        return [];
    }
  }

  private _employeeRows(department?: string, status?: string): Row[] {
    let users = this.userRepo.findAll();
    if (department) users = users.filter((u) => u.department === department);
    if (status) users = users.filter((u) => u.status === status);

    return users.map((u) => ({
      'Employee ID': u.employeeId,
      'First Name': u.firstName,
      'Last Name': u.lastName,
      Email: u.email,
      Phone: u.phone ?? '',
      Department: u.department ?? '',
      Designation: u.designation ?? '',
      Role: u.role,
      'Joining Date': u.joiningDate ?? '',
      Status: u.status,
    }));
  }

  private _attendanceRows(from?: Date, to?: Date): Row[] {
    const users = this.userRepo.findAll();
    const userMap = new Map(users.map((u) => [u.id, u]));

    const effectiveFrom = from ?? new Date(0);
    const effectiveTo = to ?? new Date();
    const records = this.attendanceRepo.findAllInRange(effectiveFrom, effectiveTo);

    return records.map((r) => {
      const user = userMap.get(r.userId);
      const checkIn = new Date(r.checkInTime);
      const checkOut = r.checkOutTime ? new Date(r.checkOutTime) : null;
      const durationMin = checkOut
        ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000)
        : null;

      return {
        'Employee ID': user?.employeeId ?? r.userId,
        Name: user ? `${user.firstName} ${user.lastName}` : r.userId,
        Date: r.checkInTime.slice(0, 10),
        'Check-In': r.checkInTime,
        'Check-Out': r.checkOutTime ?? '',
        'Duration (min)': durationMin ?? '',
        Notes: r.notes ?? '',
      };
    });
  }

  private _auditRows(from?: Date, to?: Date): Row[] {
    const { entries } = this.auditRepo.findAll({
      from,
      to,
      limit: 10000,
    });

    return entries.map((e) => ({
      Timestamp: e.createdAt,
      Actor: e.actorName ?? e.actorId ?? 'System',
      'Actor ID': e.actorId ?? '',
      Action: e.action,
      'Entity Type': e.entityType,
      'Entity ID': e.entityId ?? '',
      'IP Address': e.ipAddress ?? '',
      'Workspace ID': e.workspaceId ?? '',
      Detail: e.detail ?? '',
    }));
  }

  private _toCSV(rows: Row[]): string {
    if (rows.length === 0) return '';

    const headers = Object.keys(rows[0]);
    const escape = (v: string | number | null | undefined) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const lines = [
      headers.map(escape).join(','),
      ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
    ];

    return lines.join('\r\n');
  }

  private _toPlainText(rows: Row[], module: string): string {
    const header = `OZMO SYNC — ${module} Export\nGenerated: ${new Date().toISOString()}\n${'='.repeat(60)}\n\n`;
    if (rows.length === 0) return `${header}No records found.`;

    const cols = Object.keys(rows[0]);
    const colWidth = Math.max(...cols.map((c) => c.length), 15);
    const formatRow = (row: Row) =>
      cols.map((c) => String(row[c] ?? '').padEnd(colWidth)).join(' | ');

    const divider = cols.map(() => '-'.repeat(colWidth)).join('-+-');
    const lines = [
      header,
      cols.map((c) => c.padEnd(colWidth)).join(' | '),
      divider,
      ...rows.map(formatRow),
      '',
      `Total rows: ${rows.length}`,
    ];

    return lines.join('\n');
  }
}
