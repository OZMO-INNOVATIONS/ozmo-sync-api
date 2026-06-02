export interface AttendanceRecord {
    id: string;
    userId: string;
    checkInTime: string;
    checkOutTime: string | null;
    notes?: string;
    createdAt: string;
}
export declare class AttendanceRepository {
    private readonly store;
    create(dto: Omit<AttendanceRecord, 'id' | 'createdAt'>): AttendanceRecord;
    findById(id: string): AttendanceRecord | null;
    findOpenCheckIn(userId: string): AttendanceRecord | null;
    updateById(id: string, updates: Partial<AttendanceRecord>): AttendanceRecord | null;
    findByUserId(userId: string): AttendanceRecord[];
    findByUserIdInRange(userId: string, from: Date, to: Date): AttendanceRecord[];
    findAllInRange(from: Date, to: Date): AttendanceRecord[];
}
