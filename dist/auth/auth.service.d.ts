import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../repositories/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, UserStatus } from '../common/constants/roles.enum';
export declare class AuthService {
    private readonly userRepo;
    private readonly jwtService;
    private readonly configService;
    constructor(userRepo: UserRepository, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        user: {
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
            status: UserStatus;
            createdAt: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
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
            status: UserStatus;
            createdAt: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(rawToken: string): Promise<{
        user: {
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
            status: UserStatus;
            createdAt: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    private _issueTokens;
    private _sanitize;
    private _generateEmployeeId;
}
