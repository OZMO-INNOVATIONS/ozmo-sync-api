import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';
export declare class ProfileController {
    private readonly profileService;
    constructor(profileService: ProfileService);
    getOwnProfile(user: RequestUser): {
        message: string;
        data: {
            id: string;
            employeeId: string;
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
            role: Role;
            designation?: string;
            department?: string;
            joiningDate?: string;
            status: import("../common/constants/roles.enum").UserStatus;
            createdAt: string;
        };
    };
    updateOwnProfile(user: RequestUser, dto: UpdateProfileDto): {
        message: string;
        data: {
            id: string;
            employeeId: string;
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
            role: Role;
            designation?: string;
            department?: string;
            joiningDate?: string;
            status: import("../common/constants/roles.enum").UserStatus;
            createdAt: string;
        };
    };
    listUsers(): {
        message: string;
        data: {
            id: string;
            employeeId: string;
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
            role: Role;
            designation?: string;
            department?: string;
            joiningDate?: string;
            status: import("../common/constants/roles.enum").UserStatus;
            createdAt: string;
        }[];
    };
    getUserById(id: string): {
        message: string;
        data: {
            id: string;
            employeeId: string;
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
            role: Role;
            designation?: string;
            department?: string;
            joiningDate?: string;
            status: import("../common/constants/roles.enum").UserStatus;
            createdAt: string;
        };
    };
    deleteUser(id: string, user: RequestUser): {
        message: string;
        data: {};
    };
}
