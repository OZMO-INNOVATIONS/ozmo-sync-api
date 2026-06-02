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
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const user_repository_1 = require("../repositories/user.repository");
const staff_profile_repository_1 = require("../repositories/staff-profile.repository");
const roles_enum_1 = require("../common/constants/roles.enum");
let StaffService = class StaffService {
    constructor(userRepo, profileRepo, configService) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.configService = configService;
    }
    async create(dto) {
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
            role: dto.role,
            designation: dto.designation,
            department: dto.department,
            joiningDate: dto.joiningDate,
            employeeId,
            status: roles_enum_1.UserStatus.ACTIVE,
            refreshToken: null,
        });
        this.profileRepo.create({ userId: user.id });
        return this._sanitize(user);
    }
    findAll() {
        return this.userRepo.findAll().map((u) => this._sanitize(u));
    }
    findById(id) {
        const user = this.userRepo.findById(id);
        if (!user)
            throw new common_1.NotFoundException('Staff member not found');
        return this._sanitize(user);
    }
    async update(id, dto) {
        const existing = this.userRepo.findById(id);
        if (!existing)
            throw new common_1.NotFoundException('Staff member not found');
        const updates = { ...dto };
        if (dto.password) {
            const saltRounds = parseInt(this.configService.get('BCRYPT_SALT_ROUNDS', '12'), 10);
            updates.password = await bcrypt.hash(dto.password, saltRounds);
        }
        if (dto.email && dto.email !== existing.email) {
            const emailTaken = this.userRepo.findByEmail(dto.email);
            if (emailTaken)
                throw new common_1.ConflictException('Email already in use');
        }
        const updated = this.userRepo.updateById(id, updates);
        return this._sanitize(updated);
    }
    delete(id, actorId) {
        if (id === actorId)
            throw new common_1.ForbiddenException('Cannot delete your own account');
        const deleted = this.userRepo.deleteById(id);
        if (!deleted)
            throw new common_1.NotFoundException('Staff member not found');
        this.profileRepo.deleteByUserId(id);
    }
    search(query) {
        return this.userRepo.search(query).map((u) => this._sanitize(u));
    }
    filter(dto) {
        return this.userRepo
            .filter({ department: dto.department, status: dto.status, role: dto.role })
            .map((u) => this._sanitize(u));
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
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.UserRepository,
        staff_profile_repository_1.StaffProfileRepository,
        config_1.ConfigService])
], StaffService);
//# sourceMappingURL=staff.service.js.map