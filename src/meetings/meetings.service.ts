import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    return this.prisma.meeting.findMany({
      where: { workspaceId },
      orderBy: { dateTime: 'asc' },
    });
  }

  async create(workspaceId: string, dto: CreateMeetingDto) {
    const data: any = {
      title: dto.title,
      description: dto.description ?? null,
      dateTime: new Date(dto.dateTime),
      link: dto.link,
      duration: dto.duration,
      workspaceId,
    };

    if (dto.id) {
      data.id = dto.id;
    }

    return this.prisma.meeting.create({
      data,
    });
  }
}
