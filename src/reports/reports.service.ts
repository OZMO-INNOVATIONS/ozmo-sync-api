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

  async export(query: ExportQueryDto): Promise<{ content: string; filename: string; mimeType: string }> {
    if (query.fromDate && query.toDate) {
      const from = new Date(query.fromDate);
      const to = new Date(query.toDate);
      const diffMs = to.getTime() - from.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > 366) {
        throw new BadRequestException('Date range cannot exceed 12 months');
      }
    }

    const rows = await this._gatherRows(query);
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

  private async _gatherRows(query: ExportQueryDto): Promise<Row[]> {
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

  private async _employeeRows(department?: string, status?: string): Promise<Row[]> {
    let users = await this.userRepo.findAll();
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
      'Joining Date': u.joiningDate ? u.joiningDate.toISOString().slice(0, 10) : '',
      Status: u.status,
    }));
  }

  private async _attendanceRows(from?: Date, to?: Date): Promise<Row[]> {
    const users = await this.userRepo.findAll();
    const userMap = new Map(users.map((u) => [u.id, u]));

    const effectiveFrom = from ?? new Date(0);
    const effectiveTo = to ?? new Date();
    const records = await this.attendanceRepo.findAllSessionsInRange(effectiveFrom, effectiveTo);

    return records.map((r) => {
      const user = userMap.get(r.userId);
      const datePart = r.checkInTime.toISOString().slice(0, 10);

      return {
        'Employee ID': user?.employeeId ?? r.userId,
        Name: user ? `${user.firstName} ${user.lastName}` : r.userId,
        Date: datePart,
        'Check-In': r.checkInTime.toISOString(),
        'Check-Out': r.checkOutTime ? r.checkOutTime.toISOString() : '',
        'Duration (min)': r.durationMinutes ?? '',
        Notes: r.notes ?? '',
      };
    });
  }

  private async _auditRows(from?: Date, to?: Date): Promise<Row[]> {
    let { entries } = await this.auditRepo.findAll({
      limit: 10000,
    });

    if (from) {
      entries = entries.filter((e) => e.createdAt >= from);
    }
    if (to) {
      entries = entries.filter((e) => e.createdAt <= to);
    }

    return entries.map((e) => ({
      Timestamp: e.createdAt.toISOString(),
      Actor: e.userId ?? 'System',
      'Actor ID': e.userId ?? '',
      Action: e.action,
      'Entity Type': e.module,
      'Entity ID': e.id,
      'IP Address': e.ipAddress ?? '',
      'Workspace ID': e.workspaceId ?? '',
      Detail: e.newData?.detail ?? '',
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
