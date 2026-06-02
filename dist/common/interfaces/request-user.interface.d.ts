import { Role } from '../constants/roles.enum';
export interface RequestUser {
    id: string;
    email: string;
    role: Role;
    employeeId: string;
}
