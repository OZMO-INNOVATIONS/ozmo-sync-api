import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    let holidays = await this.prisma.holiday.findMany({
      where: {
        OR: [
          { workspaceId },
          { workspaceId: null },
        ],
      },
      orderBy: { date: 'asc' },
    });

    if (holidays.length === 0) {
      // Seed some default upcoming holidays
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const defaultHolidays = [
        {
          name: 'Independence Day',
          date: new Date(Date.UTC(currentYear, 7, 15)), // 15 Aug
          type: 'publicHoliday',
          description: 'National Holiday',
          notes: 'Celebrating freedom',
          repeatYearly: true,
        },
        {
          name: 'Gandhi Jayanti',
          date: new Date(Date.UTC(currentYear, 9, 2)), // 2 Oct
          type: 'publicHoliday',
          description: 'National Holiday',
          notes: 'Gandhi birth anniversary',
          repeatYearly: true,
        },
        {
          name: 'Christmas Day',
          date: new Date(Date.UTC(currentYear, 11, 25)), // 25 Dec
          type: 'publicHoliday',
          description: 'Festival',
          notes: 'Christmas holidays',
          repeatYearly: true,
        },
        {
          name: 'New Year Eve',
          date: new Date(Date.UTC(currentYear, 11, 31)), // 31 Dec
          type: 'companyHoliday',
          description: 'New Year celebration',
          notes: 'Last day of the year',
          repeatYearly: true,
        },
      ];

      await this.prisma.holiday.createMany({
        data: defaultHolidays.map((h) => ({
          ...h,
          workspaceId,
        })),
      });

      holidays = await this.prisma.holiday.findMany({
        where: {
          OR: [
            { workspaceId },
            { workspaceId: null },
          ],
        },
        orderBy: { date: 'asc' },
      });
    }

    return holidays.map((h) => ({
      id: h.id,
      name: h.name,
      date: h.date.toISOString(),
      type: h.type,
      description: h.description,
      notes: h.notes,
      repeatYearly: h.repeatYearly,
      workspaceIds: h.workspaceId ? [h.workspaceId] : null,
    }));
  }
}
