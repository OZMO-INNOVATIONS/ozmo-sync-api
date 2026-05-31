"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const user_repository_1 = require("../repositories/user.repository");
const roles_enum_1 = require("../common/constants/roles.enum");
let AuthService = class AuthService {
    constructor(userRepo, jwtService, configService) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        const existing = this.userRepo.findByEmail(dto.email);
        if (existing)
            throw new common_1.ConflictException('Email already in use');
        const saltRounds = parseInt(this.configService.get('BCRYPT_SALT_ROUNDS', '12'), 10);
        const hashedPassword = await bcrypt.hash(dto.password, saltRounds);
        const employeeId = this._generateEmployeeId();
        const user = this.userRepo.create({
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            password: hashedPassword,
            phone: dto.phone,
            role: dto.role ?? roles_enum_1.Role.STAFF,
            designation: dto.designation,
            department: dto.department,
            employeeId,
            status: roles_enum_1.UserStatus.ACTIVE,
            refreshToken: null,
        });
        const tokens = await this._issueTokens(user);
        return { ...tokens, user: this._sanitize(user) };
    }
    async login(dto) {
        if (!dto.email && !dto.employeeId) {
            throw new common_1.BadRequestException('Provide either email or employeeId');
        }
        const user = dto.email
            ? this.userRepo.findByEmail(dto.email)
            : this.userRepo.findByEmployeeId(dto.employeeId);
        const isMatch = user ? await bcrypt.compare(dto.password, user.password) : false;
        if (!user || !isMatch) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status !== roles_enum_1.UserStatus.ACTIVE) {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        const tokens = await this._issueTokens(user);
        return { ...tokens, user: this._sanitize(user) };
    }
    async refresh(rawToken) {
        let payload;
        try {
            payload = jwt.verify(rawToken, this.configService.get('JWT_REFRESH_SECRET'));
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = this.userRepo.findById(payload.sub);
        if (!user?.refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token not recognised — please log in again');
        }
        const isMatch = await bcrypt.compare(rawToken, user.refreshToken);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Refresh token mismatch — possible reuse detected');
        }
        const tokens = await this._issueTokens(user);
        return { ...tokens, user: this._sanitize(user) };
    }
    async logout(userId) {
        this.userRepo.saveRefreshToken(userId, null);
    }
    async _issueTokens(user) {
        const jwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
        };
        const accessToken = this.jwtService.sign(jwtPayload);
        const refreshToken = jwt.sign({ sub: user.id }, this.configService.get('JWT_REFRESH_SECRET'), {
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES', '7d'),
            algorithm: 'HS256',
        });
        const hashedRefresh = await bcrypt.hash(refreshToken, 10);
        this.userRepo.saveRefreshToken(user.id, hashedRefresh);
        return { accessToken, refreshToken };
    }
    _sanitize(user) {
        const { password, refreshToken, ...safe } = user;
        void password;
        void refreshToken;
        return safe;
    }
    _generateEmployeeId() {
        const year = new Date().getFullYear();
        const count = this.userRepo.count() + 1;
        return `OZ-${year}-${String(count).padStart(4, '0')}`;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.UserRepository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map