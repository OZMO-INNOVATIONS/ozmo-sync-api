export interface StaffProfileEntity {
    id: string;
    userId: string;
    emergencyContact?: string;
    address?: string;
    skills?: string[];
    bio?: string;
    updatedAt: string;
}
export declare class StaffProfileRepository {
    private readonly store;
    create(dto: Omit<StaffProfileEntity, 'id' | 'updatedAt'>): StaffProfileEntity;
    findByUserId(userId: string): StaffProfileEntity | null;
    updateByUserId(userId: string, updates: Partial<StaffProfileEntity>): StaffProfileEntity | null;
    deleteByUserId(userId: string): boolean;
}
