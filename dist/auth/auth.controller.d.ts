import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        message: string;
        data: {
            user: {
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
            accessToken: string;
            refreshToken: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        message: string;
        data: {
            user: {
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
            accessToken: string;
            refreshToken: string;
        };
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        message: string;
        data: {
            user: {
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
            accessToken: string;
            refreshToken: string;
        };
    }>;
    logout(user: RequestUser): Promise<{
        message: string;
        data: {};
    }>;
}
