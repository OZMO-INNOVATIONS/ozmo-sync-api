import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface AttendanceRecord {
  id: string;
  userId: string;
  checkInTime: string;
  checkOutTime: string | null;
  notes?: string;
  createdAt: string;
}

@Injectable()
export class AttendanceRepository {
  private readonly store = new Map<string, AttendanceRecord>();

  create(dto: Omit<AttendanceRecord, 'id' | 'createdAt'>): AttendanceRecord {
    const record: AttendanceRecord = {
      ...dto,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    this.store.set(record.id, record);
    return record;
  }

  findById(id: string): AttendanceRecord | null {
    return this.store.get(id) ?? null;
  }

  findOpenCheckIn(userId: string): AttendanceRecord | null {
    for (const record of this.store.values()) {
      if (record.userId === userId && record.checkOutTime === null) return record;
    }
    return null;
  }

  updateById(id: string, updates: Partial<AttendanceRecord>): AttendanceRecord | null {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.store.set(id, updated);
    return updated;
  }

  findByUserId(userId: string): AttendanceRecord[] {
    return Array.from(this.store.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime));
  }

  findByUserIdInRange(userId: string, from: Date, to: Date): AttendanceRecord[] {
    return this.findByUserId(userId).filter((r) => {
      const t = new Date(r.checkInTime);
      return t >= from && t <= to;
    });
  }

  findAllInRange(from: Date, to: Date): AttendanceRecord[] {
    return Array.from(this.store.values()).filter((r) => {
      const t = new Date(r.checkInTime);
      return t >= from && t <= to;
    });
  }
}
