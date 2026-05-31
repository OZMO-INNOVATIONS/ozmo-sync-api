import { UserRepository } from '../repositories/user.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class ProfileService {
    private readonly userRepo;
    constructor(userRepo: UserRepository);
    getProfile(userId: string): {
        id: string;
        employeeId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        role: import("../common/constants/roles.enum").Role;
        designation?: string;
        department?: string;
        joiningDate?: string;
        status: import("../common/constants/roles.enum").UserStatus;
        createdAt: string;
    };
    updateProfile(userId: string, dto: UpdateProfileDto): {
        id: string;
        employeeId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        role: import("../common/constants/roles.enum").Role;
        designation?: string;
        department?: string;
        joiningDate?: string;
        status: import("../common/constants/roles.enum").UserStatus;
        createdAt: string;
    };
    listUsers(): {
        id: string;
        employeeId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        role: import("../common/constants/roles.enum").Role;
        designation?: string;
        department?: string;
        joiningDate?: string;
        status: import("../common/constants/roles.enum").UserStatus;
        createdAt: string;
    }[];
    getUserById(id: string): {
        id: string;
        employeeId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        role: import("../common/constants/roles.enum").Role;
        designation?: string;
        department?: string;
        joiningDate?: string;
        status: import("../common/constants/roles.enum").UserStatus;
        createdAt: string;
    };
    deleteUser(id: string, actorId: string): void;
    private _sanitize;
}
