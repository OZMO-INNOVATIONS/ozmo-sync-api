import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(workspaceId: string) {
    const meetings = await this.prisma.meeting.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { meetingDate: 'asc' },
    });
    return meetings.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      dateTime: m.meetingDate.toISOString(),
      link: m.meetingLink,
      duration: m.duration,
    }));
  }

  async create(workspaceId: string, dto: CreateMeetingDto, createdBy: string) {
    const data: any = {
      title: dto.title,
      description: dto.description ?? null,
      meetingDate: new Date(dto.dateTime),
      meetingLink: dto.link,
      duration: dto.duration,
      workspaceId,
      createdBy,
    };

    const meeting = await this.prisma.meeting.create({
      data,
    });

    // Create database notification for workspace members
    try {
      const members = await this.prisma.workspaceMember.findMany({
        where: { workspaceId, deletedAt: null, status: 'ACTIVE' },
        select: { userId: true },
      });

      if (members.length > 0) {
        await this.prisma.notification.createMany({
          data: members.map((m) => ({
            workspaceId,
            userId: m.userId,
            title: 'New Meeting Scheduled',
            message: `A new meeting "${meeting.title}" has been scheduled.`,
            type: 'teamUpdate',
            actionId: meeting.id,
          })),
        });
      }
    } catch (e) {
      console.error('Error creating meeting notifications:', e);
    }

    await this.auditService.log({
      userId: createdBy,
      workspaceId,
      action: 'MEETING_CREATION',
      module: 'MEETINGS',
      newData: { meetingId: meeting.id, title: meeting.title },
      detail: `Created meeting: ${meeting.title}`,
    });

    return {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      dateTime: meeting.meetingDate.toISOString(),
      link: meeting.meetingLink,
      duration: meeting.duration,
    };
  }
}
