"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const user_repository_1 = require("../repositories/user.repository");
const attendance_repository_1 = require("../repositories/attendance.repository");
const audit_repository_1 = require("../repositories/audit.repository");
let ReportsService = class ReportsService {
    constructor(userRepo, attendanceRepo, auditRepo) {
        this.userRepo = userRepo;
        this.attendanceRepo = attendanceRepo;
        this.auditRepo = auditRepo;
    }
    export(query) {
        if (query.fromDate && query.toDate) {
            const from = new Date(query.fromDate);
            const to = new Date(query.toDate);
            const diffMs = to.getTime() - from.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            if (diffDays > 366) {
                throw new common_1.BadRequestException('Date range cannot exceed 12 months');
            }
        }
        const rows = this._gatherRows(query);
        const dateStamp = new Date().toISOString().slice(0, 10);
        const moduleName = query.module.toLowerCase();
        let content;
        let mimeType;
        let ext;
        switch (query.format) {
            case 'CSV':
                content = this._toCSV(rows);
                mimeType = 'text/csv';
                ext = 'csv';
                break;
            case 'XLSX':
                content = this._toCSV(rows);
                mimeType =
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                ext = 'xlsx';
                break;
            case 'PDF':
                content = this._toPlainText(rows, query.module);
                mimeType = 'application/pdf';
                ext = 'pdf';
                break;
            default:
                throw new common_1.BadRequestException('Invalid format');
        }
        return {
            content,
            filename: `ozmo_${moduleName}_${dateStamp}.${ext}`,
            mimeType,
        };
    }
    _gatherRows(query) {
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
    _employeeRows(department, status) {
        let users = this.userRepo.findAll();
        if (department)
            users = users.filter((u) => u.department === department);
        if (status)
            users = users.filter((u) => u.status === status);
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
    _attendanceRows(from, to) {
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
    _auditRows(from, to) {
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
    _toCSV(rows) {
        if (rows.length === 0)
            return '';
        const headers = Object.keys(rows[0]);
        const escape = (v) => {
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
    _toPlainText(rows, module) {
        const header = `OZMO SYNC — ${module} Export\nGenerated: ${new Date().toISOString()}\n${'='.repeat(60)}\n\n`;
        if (rows.length === 0)
            return `${header}No records found.`;
        const cols = Object.keys(rows[0]);
        const colWidth = Math.max(...cols.map((c) => c.length), 15);
        const formatRow = (row) => cols.map((c) => String(row[c] ?? '').padEnd(colWidth)).join(' | ');
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.UserRepository,
        attendance_repository_1.AttendanceRepository,
        audit_repository_1.AuditRepository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map