import { Injectable, ConflictException, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { UserRepository } from '../repositories/user.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { GPSCheckInDto, GPSCheckOutDto } from './dto/gps-check-in.dto';
import { FaceCheckInDto, FaceCheckOutDto } from './dto/face-check-in.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { RegularizeAttendanceDto, ReviewRegularizationDto } from './dto/regularize-attendance.dto';
import { AdminOverrideDto } from './dto/admin-override.dto';
import { formatDate, formatDateTime, formatTime, formatDuration, formatSummaryDuration, getKolkataDate } from '../common/utils/date-format.util';
import { AuditService } from '../audit/audit.service';

function calculateAttendanceStatus(firstCheckIn: Date | null, totalWorkMinutes: number): string {
  if (!firstCheckIn) return 'ABSENT';

  // Check late threshold (09:30 AM UTC)
  const h = firstCheckIn.getUTCHours();
  const m = firstCheckIn.getUTCMinutes();
  const isLate = h > 9 || (h === 9 && m > 30);

  if (totalWorkMinutes >= 480) {
    return isLate ? 'LATE' : 'PRESENT';
  } else if (totalWorkMinutes >= 240) {
    return 'HALF_DAY';
  } else {
    // If they checked in but haven't worked 4 hours yet (or still active)
    return isLate ? 'LATE' : 'PRESENT';
  }
}

@Injectable()
export class AttendanceService implements OnModuleInit {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly userRepo: UserRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  onModuleInit() {
    // Run immediately on startup
    this.autoCheckOutMissedSessions().catch(err => console.error('Initial auto check-out failed:', err));
    // Run periodically every 15 minutes
    setInterval(() => {
      this.autoCheckOutMissedSessions().catch(err => console.error('Periodic auto check-out failed:', err));
    }, 15 * 60 * 1000);
  }

  private _formatDailySummaryResponse(sessions: any[], summary?: any) {
    const formatTimeFromValue = (val: any) => {
      if (!val) return null;
      if (val instanceof Date) return formatTime(val);
      if (typeof val === 'string') {
        if (val.includes(', ')) {
          return val.split(', ')[1];
        }
        return formatTime(new Date(val));
      }
      return null;
    };

    const firstCheckIn = formatTimeFromValue(summary?.checkIn);
    const lastCheckOut = formatTimeFromValue(summary?.checkOut);
    const totalWorkMinutes = summary?.workedMinutes ?? 0;
    const totalBreakMinutes = summary?.breakMinutes ?? 0;

    return {
      firstCheckIn,
      lastCheckOut,
      totalWorkedHours: formatSummaryDuration(totalWorkMinutes),
      totalBreakHours: formatSummaryDuration(totalBreakMinutes),
      workedMinutes: totalWorkMinutes,
      breakMinutes: totalBreakMinutes,
      sessions: sessions.map((s) => ({
        checkIn: formatTimeFromValue(s.checkInTime) ?? '',
        checkOut: s.checkOutTime ? (formatTimeFromValue(s.checkOutTime) ?? null) : null,
        checkInTime: s.checkInTime ? (s.checkInTime instanceof Date ? s.checkInTime.toISOString() : new Date(s.checkInTime).toISOString()) : '',
        checkOutTime: s.checkOutTime ? (s.checkOutTime instanceof Date ? s.checkOutTime.toISOString() : new Date(s.checkOutTime).toISOString()) : null,
        duration: s.durationMinutes !== null ? formatDuration(s.durationMinutes) : '0m',
        location: s.location ?? undefined,
        deviceInfo: s.deviceInfo ?? undefined,
        notes: s.notes ?? null,
        status: s.status,
      })),
    };
  }

  async autoCheckOutMissedSessions() {
    try {
      const today = new Date();
      const todayKolkataStart = getKolkataDate(today);
      const todayKolkataStartUTC = new Date(todayKolkataStart.getTime() - 5.5 * 60 * 60 * 1000);

      // Find all active sessions where checkInTime is before todayKolkataStartUTC
      const missedSessions = await this.prisma.attendanceSession.findMany({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
          checkInTime: {
            lt: todayKolkataStartUTC,
          },
        },
        include: {
          user: true,
        },
      });

      for (const session of missedSessions) {
        try {
          const checkInKolkata = new Date(session.checkInTime.getTime() + 5.5 * 60 * 60 * 1000);
          // Auto checkout at 18:00 (6:00 PM) of the same day in Kolkata time:
          const checkOutKolkata = new Date(Date.UTC(
            checkInKolkata.getUTCFullYear(),
            checkInKolkata.getUTCMonth(),
            checkInKolkata.getUTCDate(),
            18, // 6:00 PM
            0,
            0
          ));
          
          let autoCheckOutTime = new Date(checkOutKolkata.getTime() - 5.5 * 60 * 60 * 1000);
          if (session.checkInTime.getTime() >= autoCheckOutTime.getTime()) {
            autoCheckOutTime = new Date(session.checkInTime.getTime() + 9 * 60 * 60 * 1000);
          }

          const durationMinutes = Math.max(0, Math.round((autoCheckOutTime.getTime() - session.checkInTime.getTime()) / 60000));

          await this.prisma.$transaction(async (tx) => {
            // 1. Update session to COMPLETED
            await tx.attendanceSession.update({
              where: { id: session.id },
              data: {
                checkOutTime: autoCheckOutTime,
                durationMinutes,
                status: 'COMPLETED',
                notes: 'System Auto Check-Out (Missed Manual Check-Out)',
              },
            });

            // 2. Recalculate daily summary
            const dateOnly = getKolkataDate(session.checkInTime);
            const rawSessions = await tx.attendanceSession.findMany({
              where: {
                userId: session.userId,
                checkInTime: {
                  gte: new Date(dateOnly.getTime() - 5.5 * 60 * 60 * 1000),
                  lte: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000 - 1 - 5.5 * 60 * 60 * 1000),
                },
              },
              orderBy: { checkInTime: 'asc' },
            });

            const firstCheckIn = rawSessions[0].checkInTime;
            const completedSessions = rawSessions.filter((s) => s.checkOutTime !== null);
            const lastCheckOut = completedSessions.length > 0
              ? new Date(Math.max(...completedSessions.map((s) => s.checkOutTime!.getTime())))
              : null;

            let totalBreakMinutes = 0;
            for (let i = 1; i < rawSessions.length; i++) {
              const prev = rawSessions[i - 1];
              const curr = rawSessions[i];
              if (prev.checkOutTime) {
                const gapMs = curr.checkInTime.getTime() - prev.checkOutTime.getTime();
                if (gapMs > 0) {
                  totalBreakMinutes += Math.round(gapMs / 60000);
                }
              }
            }

            const totalWorkMinutes = rawSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
            const status = calculateAttendanceStatus(firstCheckIn, totalWorkMinutes);

            await tx.attendance.upsert({
              where: {
                userId_date: {
                  userId: session.userId,
                  date: dateOnly,
                },
              },
              create: {
                workspaceId: session.workspaceId,
                userId: session.userId,
                date: dateOnly,
                checkIn: firstCheckIn,
                checkOut: lastCheckOut,
                workedMinutes: totalWorkMinutes,
                breakMinutes: totalBreakMinutes,
                status,
              },
              update: {
                checkIn: firstCheckIn,
                checkOut: lastCheckOut,
                workedMinutes: totalWorkMinutes,
                breakMinutes: totalBreakMinutes,
                status,
              },
            });

            // 3. Notify workspace Admin/Super Admin
            const admins = await tx.workspaceMember.findMany({
              where: {
                workspaceId: session.workspaceId,
                role: {
                  in: ['ADMIN', 'SUPER_ADMIN'],
                },
                status: 'ACTIVE',
              },
            });

            const employeeName = `${session.user.firstName} ${session.user.lastName}`.trim();
            const formattedDate = formatDate(session.checkInTime) || session.checkInTime.toDateString();
            const formattedTime = formatTime(autoCheckOutTime) || autoCheckOutTime.toTimeString();

            for (const admin of admins) {
              await tx.notification.create({
                data: {
                  workspaceId: session.workspaceId,
                  userId: admin.userId,
                  title: 'Missed Check-Out Alert',
                  message: `${employeeName} missed checkout on ${formattedDate}. The system has automatically checked them out at ${formattedTime}.`,
                  type: 'ATTENDANCE_MISSED_CHECKOUT',
                  isRead: false,
                },
              });
            }

            await this.auditService.log({
              userId: session.userId,
              workspaceId: session.workspaceId,
              action: 'AUTO_CHECK_OUT',
              module: 'ATTENDANCE',
              newData: { autoCheckOutTime },
              detail: `System automatically checked out ${employeeName} due to missed manual check-out.`,
            });
          });
        } catch (e) {
          console.error(`Error auto-checking out session ${session.id}:`, e);
        }
      }
    } catch (err) {
      console.error('Error in autoCheckOutMissedSessions:', err);
    }
  }

  async checkIn(userId: string, dto: CheckInDto, clientIp?: string, verificationType?: string, localIpsHeader?: string) {
    await this.autoCheckOutMissedSessions();
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.workspaceId) {
      throw new ConflictException('User is not associated with any workspace');
    }

    // Check Allowed Wifi IP Restriction
    if (!verificationType || verificationType === 'WIFI') {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: user.workspaceId },
      });
      if (workspace?.allowedWifiIp) {
        const allowedIps = workspace.allowedWifiIp.split(',').map((ip) => ip.trim());
        const cleanIp = clientIp ? clientIp.replace(/^::ffff:/, '') : '';
        const clientIps = cleanIp.split(',').map((ip) => ip.trim()).filter(Boolean);
        if (localIpsHeader) {
          const parsedLocalIps = localIpsHeader.split(',').map((ip) => ip.trim()).filter(Boolean);
          clientIps.push(...parsedLocalIps);
        }
        const isAllowed = allowedIps.some((allowedIp) => {
          if (allowedIp === '*') {
            return true;
          }
          return clientIps.some((cIp) => {
            if (cIp === allowedIp || allowedIp === '127.0.0.1' || allowedIp === '::1' || cIp === '127.0.0.1' || cIp === '::1') {
              return true;
            }
            const allowedParts = allowedIp.split('.');
            const clientParts = cIp.split('.');
            if (allowedParts.length === 4 && clientParts.length === 4) {
              return allowedParts[0] === clientParts[0] &&
                     allowedParts[1] === clientParts[1] &&
                     allowedParts[2] === clientParts[2];
            }
            return false;
          });
        });
        if (!isAllowed) {
          throw new ConflictException(
            `Access Denied: You are not connected to the authorized office WiFi network. Allowed IP(s): ${workspace.allowedWifiIp}. Your IP: ${cleanIp || 'unknown'}`
          );
        }
      }
    }

    const checkInTime = dto.checkInTime ? new Date(dto.checkInTime) : new Date();
    const dateOnly = getKolkataDate(checkInTime);

    return await this.prisma.$transaction(async (tx) => {
      // Prevent duplicate Check-In without Check-Out
      const open = await this.attendanceRepo.findOpenSession(userId, tx);
      if (open) {
        throw new ConflictException('You are already checked in. Please check out first.');
      }

      // Create new session
      const session = await this.attendanceRepo.createSession(
        {
          userId,
          workspaceId: user.workspaceId!,
          checkInTime,
          notes: dto.notes,
          location: dto.location,
          deviceInfo: dto.deviceInfo,
          verificationType,
        },
        tx,
      );

      // Fetch all sessions for today (Kolkata timezone range)
      const rawSessions = await tx.attendanceSession.findMany({
        where: {
          userId,
          checkInTime: {
            gte: new Date(dateOnly.getTime() - 5.5 * 60 * 60 * 1000),
            lte: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000 - 1 - 5.5 * 60 * 60 * 1000),
          },
        },
        orderBy: { checkInTime: 'asc' },
      });

      // Recalculate daily summary
      const firstCheckIn = rawSessions[0].checkInTime;
      const lastCheckOut = null; // Still active

      // Calculate break time so far
      let totalBreakMinutes = 0;
      for (let i = 1; i < rawSessions.length; i++) {
        const prev = rawSessions[i - 1];
        const curr = rawSessions[i];
        if (prev.checkOutTime) {
          const gapMs = curr.checkInTime.getTime() - prev.checkOutTime.getTime();
          if (gapMs > 0) {
            totalBreakMinutes += Math.round(gapMs / 60000);
          }
        }
      }

      const totalWorkMinutes = rawSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
      const status = calculateAttendanceStatus(firstCheckIn, totalWorkMinutes);

      const summary = await this.attendanceRepo.upsertDailySummary(
        {
          workspaceId: user.workspaceId!,
          userId,
          date: dateOnly,
          checkIn: firstCheckIn,
          checkOut: lastCheckOut,
          workedMinutes: totalWorkMinutes,
          breakMinutes: totalBreakMinutes,
          status,
          verificationType,
        },
        tx,
      );

      await this.auditService.log({
        userId,
        workspaceId: user.workspaceId!,
        action: 'CHECK_IN',
        module: 'ATTENDANCE',
        newData: { checkInTime },
        detail: `User checked in at ${formatDateTime(checkInTime) || checkInTime.toISOString()}`,
      });

      return session;
    });
  }

  async checkOut(userId: string, dto: CheckOutDto, clientIp?: string, verificationType?: string, localIpsHeader?: string) {
    await this.autoCheckOutMissedSessions();
    const checkOutTime = dto.checkOutTime ? new Date(dto.checkOutTime) : new Date();

    return await this.prisma.$transaction(async (tx) => {
      const open = await this.attendanceRepo.findOpenSession(userId, tx);
      if (!open) {
        throw new NotFoundException('No active check-in found');
      }

      // Check Allowed Wifi IP Restriction
      if (!verificationType || verificationType === 'WIFI') {
        const workspace = await tx.workspace.findUnique({
          where: { id: open.workspaceId },
        });
        if (workspace?.allowedWifiIp) {
          const allowedIps = workspace.allowedWifiIp.split(',').map((ip) => ip.trim());
          const cleanIp = clientIp ? clientIp.replace(/^::ffff:/, '') : '';
          const clientIps = cleanIp.split(',').map((ip) => ip.trim()).filter(Boolean);
          if (localIpsHeader) {
            const parsedLocalIps = localIpsHeader.split(',').map((ip) => ip.trim()).filter(Boolean);
            clientIps.push(...parsedLocalIps);
          }
          const isAllowed = allowedIps.some((allowedIp) => {
            if (allowedIp === '*') {
              return true;
            }
            return clientIps.some((cIp) => {
              if (cIp === allowedIp || allowedIp === '127.0.0.1' || allowedIp === '::1' || cIp === '127.0.0.1' || cIp === '::1') {
                return true;
              }
              const allowedParts = allowedIp.split('.');
              const clientParts = cIp.split('.');
              if (allowedParts.length === 4 && clientParts.length === 4) {
                return allowedParts[0] === clientParts[0] &&
                       allowedParts[1] === clientParts[1] &&
                       allowedParts[2] === clientParts[2];
              }
              return false;
            });
          });
          if (!isAllowed) {
            throw new ConflictException(
              `Access Denied: You are not connected to the authorized office WiFi network. Allowed IP(s): ${workspace.allowedWifiIp}. Your IP: ${cleanIp || 'unknown'}`
            );
          }
        }
      }

      const checkInTime = open.checkInTime;
      const durationMinutes = Math.max(0, Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000));

      // Update active session
      const session = await this.attendanceRepo.updateSession(
        open.id,
        {
          checkOutTime,
          durationMinutes,
          status: 'COMPLETED',
          notes: dto.notes,
          location: dto.location,
          deviceInfo: dto.deviceInfo,
          verificationType,
        },
        tx,
      );

      // Get date of the check-in session (Kolkata timezone range)
      const dateOnly = getKolkataDate(checkInTime);

      // Fetch all sessions for today
      const rawSessions = await tx.attendanceSession.findMany({
        where: {
          userId,
          checkInTime: {
            gte: new Date(dateOnly.getTime() - 5.5 * 60 * 60 * 1000),
            lte: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000 - 1 - 5.5 * 60 * 60 * 1000),
          },
        },
        orderBy: { checkInTime: 'asc' },
      });

      // Recalculate daily summary
      const firstCheckIn = rawSessions[0].checkInTime;
      const completedSessions = rawSessions.filter((s) => s.checkOutTime !== null);
      const lastCheckOut = completedSessions.length > 0
        ? new Date(Math.max(...completedSessions.map((s) => s.checkOutTime!.getTime())))
        : null;

      // Calculate break time
      let totalBreakMinutes = 0;
      for (let i = 1; i < rawSessions.length; i++) {
        const prev = rawSessions[i - 1];
        const curr = rawSessions[i];
        if (prev.checkOutTime) {
          const gapMs = curr.checkInTime.getTime() - prev.checkOutTime.getTime();
          if (gapMs > 0) {
            totalBreakMinutes += Math.round(gapMs / 60000);
          }
        }
      }

      const totalWorkMinutes = rawSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
      const status = calculateAttendanceStatus(firstCheckIn, totalWorkMinutes);

      const summary = await this.attendanceRepo.upsertDailySummary(
        {
          workspaceId: open.workspaceId,
          userId,
          date: dateOnly,
          checkIn: firstCheckIn,
          checkOut: lastCheckOut,
          workedMinutes: totalWorkMinutes,
          breakMinutes: totalBreakMinutes,
          status,
          verificationType,
        },
        tx,
      );

      await this.auditService.log({
        userId,
        workspaceId: open.workspaceId,
        action: 'CHECK_OUT',
        module: 'ATTENDANCE',
        newData: { checkOutTime },
        detail: `User checked out at ${formatDateTime(checkOutTime) || checkOutTime.toISOString()}`,
      });

      return session;
    });
  }

  async checkInWifi(userId: string, dto: CheckInDto, clientIp: string, localIps?: string) {
    return this.checkIn(userId, dto, clientIp, 'WIFI', localIps);
  }

  async checkOutWifi(userId: string, dto: CheckOutDto, clientIp: string, localIps?: string) {
    return this.checkOut(userId, dto, clientIp, 'WIFI', localIps);
  }

  private _calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }

  async checkInLocation(userId: string, dto: GPSCheckInDto) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.workspaceId) {
      throw new ConflictException('User is not associated with any workspace');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: user.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.latitude === null || workspace.longitude === null) {
      throw new BadRequestException('Workspace geofencing coordinates are not configured by the admin.');
    }

    const distance = this._calculateDistance(
      dto.latitude,
      dto.longitude,
      workspace.latitude,
      workspace.longitude,
    );

    const radius = workspace.geofenceRadius ?? 100;

    if (distance > radius) {
      throw new ConflictException(
        `Access Denied: You are outside the authorized office geofence. Distance: ${Math.round(distance)}m. Allowed Radius: ${radius}m.`
      );
    }

    return this.checkIn(userId, dto, undefined, 'LOCATION');
  }

  async checkOutLocation(userId: string, dto: GPSCheckOutDto) {
    const open = await this.attendanceRepo.findOpenSession(userId);
    if (!open) {
      throw new NotFoundException('No active check-in found');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: open.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.latitude === null || workspace.longitude === null) {
      throw new BadRequestException('Workspace geofencing coordinates are not configured by the admin.');
    }

    const distance = this._calculateDistance(
      dto.latitude,
      dto.longitude,
      workspace.latitude,
      workspace.longitude,
    );

    const radius = workspace.geofenceRadius ?? 100;

    if (distance > radius) {
      throw new ConflictException(
        `Access Denied: You are outside the authorized office geofence. Distance: ${Math.round(distance)}m. Allowed Radius: ${radius}m.`
      );
    }

    return this.checkOut(userId, dto, undefined, 'LOCATION');
  }

  async checkInFace(userId: string, dto: FaceCheckInDto) {
    if (!dto.facePhoto || dto.facePhoto.trim().length === 0) {
      throw new BadRequestException('Face photo is required for Face ID verification.');
    }
    // Stub matching logic - simulate success
    return this.checkIn(userId, dto, undefined, 'FACE_ID');
  }

  async checkOutFace(userId: string, dto: FaceCheckOutDto) {
    if (!dto.facePhoto || dto.facePhoto.trim().length === 0) {
      throw new BadRequestException('Face photo is required for Face ID verification.');
    }
    // Stub matching logic - simulate success
    return this.checkOut(userId, dto, undefined, 'FACE_ID');
  }

  async getTodayAttendance(userId: string) {
    await this.autoCheckOutMissedSessions();
    const now = new Date();
    const dateOnly = getKolkataDate(now);

    const from = new Date(dateOnly.getTime() - 5.5 * 60 * 60 * 1000);
    const to = new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000 - 1 - 5.5 * 60 * 60 * 1000);
    const sessions = await this.attendanceRepo.findSessionsByUserIdInRange(userId, from, to);
    const summary = await this.attendanceRepo.findDailySummary(userId, dateOnly);

    if (sessions.length === 0) {
      return {
        firstCheckIn: null,
        lastCheckOut: null,
        totalWorkedHours: '0h 0m',
        totalBreakHours: '0h 0m',
        sessions: [],
      };
    }

    return this._formatDailySummaryResponse(sessions, summary);
  }

  async getStatus(userId: string) {
    await this.autoCheckOutMissedSessions();
    const openSession = await this.attendanceRepo.findOpenSession(userId);
    const user = await this.userRepo.findById(userId);
    let allowedWifiIp: string | null = null;
    if (user && user.workspaceId) {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: user.workspaceId },
      });
      allowedWifiIp = workspace?.allowedWifiIp ?? null;
    }

    const today = new Date();
    const dateOnly = getKolkataDate(today);

    // Fetch all sessions for today (Kolkata timezone range)
    const rawSessions = await this.prisma.attendanceSession.findMany({
      where: {
        userId,
        checkInTime: {
          gte: new Date(dateOnly.getTime() - 5.5 * 60 * 60 * 1000),
          lte: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000 - 1 - 5.5 * 60 * 60 * 1000),
        },
      },
      orderBy: { checkInTime: 'asc' },
    });

    const summary = await this.attendanceRepo.findDailySummary(userId, dateOnly);

    let currentStatus = 'Not Checked In';
    let checkInTime: Date | null = null;
    let checkOutTime: Date | null = null;
    let todayDurationMinutes = 0;
    let breakDurationMinutes = 0;

    // Calculate break time
    let totalBreakMinutes = 0;
    for (let i = 1; i < rawSessions.length; i++) {
      const prev = rawSessions[i - 1];
      const curr = rawSessions[i];
      if (prev.checkOutTime) {
        const gapMs = curr.checkInTime.getTime() - prev.checkOutTime.getTime();
        if (gapMs > 0) {
          totalBreakMinutes += Math.round(gapMs / 60000);
        }
      }
    }
    breakDurationMinutes = summary?.breakMinutes ?? totalBreakMinutes;

    if (openSession) {
      currentStatus = 'Checked In';
      checkInTime = rawSessions[0]?.checkInTime || openSession.checkInTime;
      // Worked minutes for completed sessions
      const completedWorkMinutes = rawSessions.reduce((sum, s) => sum + (s.checkOutTime ? (s.durationMinutes ?? 0) : 0), 0);
      // Active session minutes so far
      const activeMs = today.getTime() - openSession.checkInTime.getTime();
      const activeMinutes = Math.max(0, Math.round(activeMs / 60000));
      todayDurationMinutes = completedWorkMinutes + activeMinutes;
    } else if (summary && summary.checkIn) {
      currentStatus = 'Checked Out';
      checkInTime = summary.checkIn;
      checkOutTime = summary.checkOut;
      todayDurationMinutes = summary.workedMinutes;
    }

    const todayDuration = formatSummaryDuration(todayDurationMinutes);
    const breakDuration = formatSummaryDuration(breakDurationMinutes);

    return {
      isCheckedIn: !!openSession,
      status: currentStatus,
      checkInTime,
      checkOutTime,
      todayDuration,
      breakDuration,
      todayDurationMinutes,
      breakDurationMinutes,
      allowedWifiIp,
      session: openSession ? {
        id: openSession.id,
        checkInTime: openSession.checkInTime,
        location: openSession.location,
      } : null,
    };
  }

  async getDailySummary(userId: string) {
    const today = new Date();
    const dateOnly = getKolkataDate(today);
    const summary = await this.attendanceRepo.findDailySummary(userId, dateOnly);
    
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    return {
      todayAttendance: summary ? summary.status : (isWeekend ? 'WEEK_OFF' : 'ABSENT'),
      workingTime: summary ? formatSummaryDuration(summary.workedMinutes) : '0h 0m',
      status: summary ? summary.status : (isWeekend ? 'WEEK_OFF' : 'ABSENT'),
    };
  }

  async getWeeklySummary(userId: string) {
    const startOfWeek = this._startOfCurrentWeek();
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    const summaries = await this.attendanceRepo.findDailySummariesInRange(userId, startOfWeek, endOfWeek);

    const presentDays = summaries.filter((s) => ['PRESENT', 'LATE', 'HALF_DAY', 'WFH'].includes(s.status.toUpperCase())).length;
    const absentDays = summaries.filter((s) => s.status.toUpperCase() === 'ABSENT').length;
    const leaveDays = summaries.filter((s) => ['LEAVE', 'HALF_DAY_LEAVE'].includes(s.status.toUpperCase())).length;
    
    const weeklyMinutes = summaries.reduce((sum, s) => sum + s.workedMinutes, 0);
    const weeklyHours = formatSummaryDuration(weeklyMinutes);

    const totalWorkingDays = 5;
    const attendancePercentage = totalWorkingDays > 0
      ? Math.min(100, Math.round((presentDays / totalWorkingDays) * 100))
      : 100;

    const avgMinutes = presentDays > 0 ? Math.round(weeklyMinutes / presentDays) : 0;
    const averageWorkingHours = formatSummaryDuration(avgMinutes);

    return {
      presentDays,
      absentDays,
      leaveDays,
      weeklyHours,
      averageWorkingHours,
      attendancePercentage,
    };
  }

  async getMonthlySummary(userId: string) {
    const today = new Date();
    const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const nextMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
    const endOfMonth = new Date(nextMonth.getTime() - 1);

    const summaries = await this.attendanceRepo.findDailySummariesInRange(userId, startOfMonth, endOfMonth);

    const presentDays = summaries.filter((s) => ['PRESENT', 'LATE', 'HALF_DAY', 'WFH'].includes(s.status.toUpperCase())).length;
    const absentDays = summaries.filter((s) => s.status.toUpperCase() === 'ABSENT').length;
    const leaveDays = summaries.filter((s) => ['LEAVE', 'HALF_DAY_LEAVE'].includes(s.status.toUpperCase())).length;
    const lateEntries = summaries.filter((s) => s.status.toUpperCase() === 'LATE').length;

    const monthlyMinutes = summaries.reduce((sum, s) => sum + s.workedMinutes, 0);
    const monthlyHours = formatSummaryDuration(monthlyMinutes);

    let workingDaysSoFar = 0;
    const cur = new Date(startOfMonth);
    const endLimit = today < endOfMonth ? today : endOfMonth;
    while (cur <= endLimit) {
      const day = cur.getUTCDay();
      if (day !== 0 && day !== 6) {
        workingDaysSoFar++;
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const attendancePercentage = workingDaysSoFar > 0
      ? Math.min(100, Math.round((presentDays / workingDaysSoFar) * 100))
      : 100;

    return {
      presentDays,
      absentDays,
      leaveDays,
      lateEntries,
      monthlyHours,
      attendancePercentage,
    };
  }

  async getAttendanceHistory(userId: string, query: AttendanceQueryDto) {
    const { from, to } = this._resolveRange(query);

    // Fetch summaries in range
    const summaries = await this.attendanceRepo.findDailySummariesInRange(userId, from, to);

    // Fetch sessions in range
    const sessions = await this.attendanceRepo.findSessionsByUserIdInRange(userId, from, to);

    // Group sessions by UTC date string
    const sessionsByDate = new Map<string, any[]>();
    for (const s of sessions) {
      const formatted = formatDate(s.checkInTime);
      if (formatted) {
        if (!sessionsByDate.has(formatted)) {
          sessionsByDate.set(formatted, []);
        }
        sessionsByDate.get(formatted)!.push(s);
      }
    }

    return summaries.map((sum) => {
      const formattedDate = formatDate(sum.date) || '';
      const dateSessions = sessionsByDate.get(formattedDate) ?? [];

      return {
        date: sum.date,
        ...this._formatDailySummaryResponse(dateSessions, sum),
        attendanceStatus: sum.status,
        totalSessions: dateSessions.length,
      };
    });
  }

  async getAttendanceSummary(userId: string, query: AttendanceQueryDto) {
    const { from, to } = this._resolveRange(query);

    // Fetch summaries in range
    const summaries = await this.attendanceRepo.findDailySummariesInRange(userId, from, to);

    // Get today's hours
    const today = new Date();
    const todayDateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const todaySummary = summaries.find((s) => {
      const d = new Date(s.date);
      return d.getUTCDate() === todayDateOnly.getUTCDate() &&
             d.getUTCMonth() === todayDateOnly.getUTCMonth() &&
             d.getUTCFullYear() === todayDateOnly.getUTCFullYear();
    });
    const dailyHours = todaySummary ? formatSummaryDuration(todaySummary.workedMinutes) : '0h 0m';

    // Calculate weekly hours
    const startOfWeek = this._startOfCurrentWeek();
    const weeklySummaries = summaries.filter((s) => new Date(s.date) >= startOfWeek);
    const weeklyMinutes = weeklySummaries.reduce((sum, s) => sum + s.workedMinutes, 0);
    const weeklyHours = formatSummaryDuration(weeklyMinutes);

    // Calculate monthly hours
    const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const monthlySummaries = summaries.filter((s) => new Date(s.date) >= startOfMonth);
    const monthlyMinutes = monthlySummaries.reduce((sum, s) => sum + s.workedMinutes, 0);
    const monthlyHours = formatSummaryDuration(monthlyMinutes);

    // Calculate present days in query range
    const presentDays = summaries.filter((s) => s.workedMinutes > 0).length;

    // Calculate total working days in range (Monday to Friday)
    let totalWorkingDays = 0;
    const cur = new Date(from);
    while (cur <= to) {
      const day = cur.getUTCDay();
      if (day !== 0 && day !== 6) {
        totalWorkingDays++;
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const attendancePercentage = totalWorkingDays > 0
      ? Math.round((presentDays / totalWorkingDays) * 1000) / 10
      : 0;

    // Calculate late check-ins
    const lateCheckIns = summaries.filter((s) => s.status === 'LATE').length;

    // Calculate overtime (minutes worked > 480 per day)
    let totalOvertimeMinutes = 0;
    for (const s of summaries) {
      if (s.workedMinutes > 480) {
        totalOvertimeMinutes += (s.workedMinutes - 480);
      }
    }
    const overtime = formatSummaryDuration(totalOvertimeMinutes);

    // Calculate average working hours
    const totalMinutes = summaries.reduce((sum, s) => sum + s.workedMinutes, 0);
    const avgMinutes = presentDays > 0 ? Math.round(totalMinutes / presentDays) : 0;
    const averageWorkingHours = formatSummaryDuration(avgMinutes);

    return {
      dailyHours,
      weeklyHours,
      monthlyHours,
      attendancePercentage,
      lateCheckIns,
      overtime,
      averageWorkingHours,
    };
  }

  async getMonthlyReport(userId: string, query: AttendanceQueryDto) {
    const today = new Date();
    let year = today.getUTCFullYear();
    let month = today.getUTCMonth() + 1;

    if (query.month) {
      const parts = query.month.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    }

    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const summaries = await this.attendanceRepo.findDailySummariesInRange(userId, from, to);
    const sessions = await this.attendanceRepo.findSessionsByUserIdInRange(userId, from, to);

    // Group sessions by date
    const sessionsByDate = new Map<string, any[]>();
    for (const s of sessions) {
      const formatted = formatDate(s.checkInTime);
      if (formatted) {
        if (!sessionsByDate.has(formatted)) {
          sessionsByDate.set(formatted, []);
        }
        sessionsByDate.get(formatted)!.push(s);
      }
    }

    const report: any[] = [];
    const cur = new Date(from);
    while (cur <= to) {
      const formattedDate = formatDate(cur)!;
      const daySummary = summaries.find((s) => formatDate(s.date) === formattedDate);

      if (daySummary) {
        const dateSessions = sessionsByDate.get(formattedDate) ?? [];
        report.push({
          date: formattedDate,
          ...this._formatDailySummaryResponse(dateSessions, daySummary),
          attendanceStatus: daySummary.status,
          totalSessions: dateSessions.length,
        });
      } else {
        const dayOfWeek = cur.getUTCDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        report.push({
          date: formattedDate,
          firstCheckIn: null,
          lastCheckOut: null,
          totalWorkedHours: '0h 0m',
          totalBreakHours: '0h 0m',
          sessions: [],
          attendanceStatus: isWeekend ? 'WEEKEND' : 'ABSENT',
          totalSessions: 0,
        });
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    return report;
  }

  async getDashboard(query: AttendanceQueryDto) {
    await this.autoCheckOutMissedSessions();
    const { from, to } = this._resolveRange(query);
    const summaries = await this.attendanceRepo.findAllDailySummariesInRange(from, to);
    const rawSessions = await this.attendanceRepo.findAllSessionsInRange(from, to);

    const checkedIn = new Set(summaries.map((s) => s.userId));
    const completedRaw = rawSessions.filter((s) => s.status === 'COMPLETED');

    const totalDurationMinutes = completedRaw.reduce((sum, s) => {
      if (!s.checkOutTime) return sum;
      return sum + Math.round((s.checkOutTime.getTime() - s.checkInTime.getTime()) / 60000);
    }, 0);

    return {
      period: {
        from: formatDateTime(from) ?? from.toISOString(),
        to: formatDateTime(to) ?? to.toISOString(),
      },
      totalPresent: checkedIn.size,
      totalSessions: rawSessions.length,
      completedSessions: completedRaw.length,
      totalDurationMinutes,
      totalDuration: formatDuration(totalDurationMinutes),
    };
  }

  private _resolveRange(query: AttendanceQueryDto): { from: Date; to: Date } {
    const now = new Date();

    if (query.date) {
      const dateOnly = new Date(`${query.date}T00:00:00.000Z`);
      const from = new Date(dateOnly.getTime() - 5.5 * 60 * 60 * 1000);
      const to = new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000 - 1 - 5.5 * 60 * 60 * 1000);
      return { from, to };
    }

    if (query.month) {
      const [year, month] = query.month.split('-').map(Number);
      const from = new Date(Date.UTC(year, month - 1, 1));
      const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      return { from, to };
    }

    if (query.week) {
      const [year, weekStr] = query.week.split('-W');
      const week = parseInt(weekStr, 10);
      const from = this._isoWeekStart(parseInt(year, 10), week);
      const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      return { from, to };
    }

    if (query.from && query.to) {
      return {
        from: new Date(`${query.from}T00:00:00.000Z`),
        to: new Date(`${query.to}T23:59:59.999Z`),
      };
    }

    // Default: current month to resolve history/analytics properly
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    return { from, to };
  }

  private _isoWeekStart(year: number, week: number): Date {
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = jan4.getUTCDay() || 7;
    const weekStart = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
    weekStart.setUTCDate(weekStart.getUTCDate() + (week - 1) * 7);
    return weekStart;
  }

  private _startOfCurrentWeek(): Date {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
    return monday;
  }

  private _getWeekBounds(date: Date) {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0));
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);
    return { monday, sunday };
  }

  async submitRegularization(userId: string, dto: RegularizeAttendanceDto) {
    const reqDate = new Date(dto.date);
    const { monday, sunday } = this._getWeekBounds(reqDate);

    // Limit check: weekly limit of 2 requests (PENDING or APPROVED)
    const count = await this.prisma.attendanceRegularization.count({
      where: {
        userId,
        date: {
          gte: monday,
          lte: sunday,
        },
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (count >= 2) {
      throw new BadRequestException('You have exceeded the weekly limit of 2 regularization requests for this week.');
    }

    // Check if this request is a "late push"
    let isLatePush = false;
    if (dto.type === 'CHECK_IN' || dto.type === 'BOTH') {
      if (dto.checkIn) {
        const ciDate = new Date(dto.checkIn);
        const h = ciDate.getUTCHours();
        const m = ciDate.getUTCMinutes();
        if (h > 9 || (h === 9 && m > 30)) {
          isLatePush = true;
        }
      }
      const existingAttendance = await this.prisma.attendance.findUnique({
        where: { userId_date: { userId, date: reqDate } },
      });
      if (existingAttendance && existingAttendance.status === 'LATE') {
        isLatePush = true;
      }
    }

    if (isLatePush) {
      const existingRequests = await this.prisma.attendanceRegularization.findMany({
        where: {
          userId,
          date: {
            gte: monday,
            lte: sunday,
          },
          status: { in: ['PENDING', 'APPROVED'] },
        },
      });

      let latePushCount = 0;
      for (const req of existingRequests) {
        if (req.type === 'CHECK_IN' || req.type === 'BOTH') {
          if (req.checkIn) {
            const ci = new Date(req.checkIn);
            if (ci.getUTCHours() > 9 || (ci.getUTCHours() === 9 && ci.getUTCMinutes() > 30)) {
              latePushCount++;
              continue;
            }
          }
          const att = await this.prisma.attendance.findUnique({
            where: { userId_date: { userId: req.userId, date: req.date } },
          });
          if (att && att.status === 'LATE') {
            latePushCount++;
          }
        }
      }

      if (latePushCount >= 1) {
        throw new BadRequestException('You have exceeded the limit of 1 late check-in correction request per week.');
      }
    }

    const user = await this.userRepo.findById(userId);
    if (!user || !user.workspaceId) {
      throw new ConflictException('User is not associated with any workspace.');
    }

    const regularization = await this.prisma.attendanceRegularization.create({
      data: {
        workspaceId: user.workspaceId,
        userId,
        date: reqDate,
        type: dto.type as any,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
        reason: dto.reason,
        status: 'PENDING',
      },
    });

    await this.auditService.log({
      userId,
      workspaceId: user.workspaceId,
      action: 'ATTENDANCE_REGULARIZATION_SUBMIT',
      module: 'ATTENDANCE',
      newData: regularization,
      detail: `Submitted regularization request for ${dto.date} (${dto.type})`,
    });

    return regularization;
  }

  async getRegularizations(userId: string, role: string, workspaceId: string, status?: string) {
    const isAdminOrTL = ['ADMIN', 'SUPER_ADMIN', 'HR', 'TEAM_LEAD'].includes(role);
    if (isAdminOrTL) {
      return await this.prisma.attendanceRegularization.findMany({
        where: {
          workspaceId,
          status: status ? (status as any) : undefined,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      return await this.prisma.attendanceRegularization.findMany({
        where: {
          userId,
          status: status ? (status as any) : undefined,
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  async actionRegularization(id: string, adminId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    const req = await this.prisma.attendanceRegularization.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException('Regularization request not found');

    const updated = await this.prisma.attendanceRegularization.update({
      where: { id },
      data: {
        status: status as any,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        approvedById: adminId,
        approvedAt: new Date(),
      },
    });

    if (status === 'APPROVED') {
      let workedMinutes = 0;
      let checkInTime = req.checkIn;
      let checkOutTime = req.checkOut;

      const existingAtt = await this.prisma.attendance.findUnique({
        where: { userId_date: { userId: req.userId, date: req.date } },
      });

      if (existingAtt) {
        if (!checkInTime) checkInTime = existingAtt.checkIn;
        if (!checkOutTime) checkOutTime = existingAtt.checkOut;
      }

      if (checkInTime && checkOutTime) {
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        if (diffMs > 0) {
          workedMinutes = Math.round(diffMs / 60000);
        }
      }

      let lateMinutes = 0;
      if (checkInTime) {
        const h = checkInTime.getUTCHours();
        const m = checkInTime.getUTCMinutes();
        const threshold = 9 * 60 + 30; // 09:30 UTC
        const current = h * 60 + m;
        if (current > threshold) {
          lateMinutes = current - threshold;
        }
      }

      const statusStr = calculateAttendanceStatus(checkInTime, workedMinutes);

      await this.prisma.attendance.upsert({
        where: { userId_date: { userId: req.userId, date: req.date } },
        create: {
          workspaceId: req.workspaceId,
          userId: req.userId,
          date: req.date,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          workedMinutes,
          lateMinutes,
          status: statusStr,
        },
        update: {
          checkIn: checkInTime,
          checkOut: checkOutTime,
          workedMinutes,
          lateMinutes,
          status: statusStr,
        },
      });
    }

    await this.auditService.log({
      userId: adminId,
      workspaceId: req.workspaceId,
      action: `ATTENDANCE_REGULARIZATION_${status}`,
      module: 'ATTENDANCE',
      newData: updated,
      detail: `${status} regularization request ${id} for user ${req.userId}`,
    });

    return updated;
  }

  async overrideAttendance(adminId: string, dto: AdminOverrideDto) {
    const targetUser = await this.userRepo.findById(dto.employeeId);
    if (!targetUser) {
      throw new NotFoundException('Employee not found');
    }
    if (!targetUser.workspaceId) {
      throw new ConflictException('Employee is not associated with any workspace');
    }

    const date = new Date(dto.date);
    const checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
    const checkOut = dto.checkOut ? new Date(dto.checkOut) : null;

    // Calculate workedMinutes
    let workedMinutes = 0;
    if (checkIn && checkOut) {
      workedMinutes = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));
    }

    // Call upsertDailySummary to save to the database
    const summary = await this.attendanceRepo.upsertDailySummary({
      workspaceId: targetUser.workspaceId,
      userId: targetUser.id,
      date,
      checkIn,
      checkOut,
      status: dto.status,
      workedMinutes,
      breakMinutes: 0,
      lateMinutes: 0,
      overtimeMinutes: 0,
    });

    await this.auditService.log({
      userId: adminId,
      workspaceId: targetUser.workspaceId,
      action: 'ATTENDANCE_OVERRIDE_ADMIN',
      module: 'ATTENDANCE',
      newData: {
        employeeId: dto.employeeId,
        status: dto.status,
        date: dto.date,
        checkIn: dto.checkIn,
        checkOut: dto.checkOut,
      },
      detail: `Admin overridden attendance for user ${dto.employeeId} on ${dto.date} to ${dto.status}`,
    });

    return summary;
  }
}
