import { Role, UserStatus } from '../../common/constants/roles.enum';
export declare class StaffFilterDto {
    department?: string;
    status?: UserStatus;
    role?: Role;
}
export declare class StaffSearchDto {
    q: string;
}
