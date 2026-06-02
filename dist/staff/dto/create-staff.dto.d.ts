import { Role } from '../../common/constants/roles.enum';
export declare class CreateStaffDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role: Role;
    designation?: string;
    department?: string;
    joiningDate?: string;
}
