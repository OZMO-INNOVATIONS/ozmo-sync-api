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
    return this.prisma.meeting.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { meetingDate: 'asc' },
    });
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

    await this.auditService.log({
      userId: createdBy,
      workspaceId,
      action: 'MEETING_CREATION',
      module: 'MEETINGS',
      newData: { meetingId: meeting.id, title: meeting.title },
      detail: `Created meeting: ${meeting.title}`,
    });

    return meeting;
  }
}
