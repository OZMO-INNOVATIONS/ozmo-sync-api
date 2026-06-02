import { Role, UserStatus } from '../common/constants/roles.enum';
export interface UserEntity {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role: Role;
    designation?: string;
    department?: string;
    joiningDate?: string;
    status: UserStatus;
    createdAt: string;
    refreshToken: string | null;
}
export declare class UserRepository {
    private readonly store;
    findAll(): UserEntity[];
    findById(id: string): UserEntity | null;
    findByEmail(email: string): UserEntity | null;
    findByEmployeeId(employeeId: string): UserEntity | null;
    create(dto: Omit<UserEntity, 'id' | 'createdAt'>): UserEntity;
    updateById(id: string, updates: Partial<UserEntity>): UserEntity | null;
    saveRefreshToken(id: string, token: string | null): void;
    deleteById(id: string): boolean;
    count(): number;
    search(query: string): UserEntity[];
    filter(criteria: {
        department?: string;
        status?: UserStatus;
        role?: Role;
    }): UserEntity[];
}
