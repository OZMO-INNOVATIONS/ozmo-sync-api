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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const user_repository_1 = require("../repositories/user.repository");
let ProfileService = class ProfileService {
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    getProfile(userId) {
        const user = this.userRepo.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this._sanitize(user);
    }
    updateProfile(userId, dto) {
        const updated = this.userRepo.updateById(userId, dto);
        if (!updated)
            throw new common_1.NotFoundException('User not found');
        return this._sanitize(updated);
    }
    listUsers() {
        return this.userRepo.findAll().map((u) => this._sanitize(u));
    }
    getUserById(id) {
        const user = this.userRepo.findById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this._sanitize(user);
    }
    deleteUser(id, actorId) {
        if (id === actorId) {
            throw new common_1.ForbiddenException('Cannot delete your own account');
        }
        const deleted = this.userRepo.deleteById(id);
        if (!deleted)
            throw new common_1.NotFoundException('User not found');
    }
    _sanitize(user) {
        const { password, refreshToken, ...safe } = user;
        void password;
        void refreshToken;
        return safe;
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.UserRepository])
], ProfileService);
//# sourceMappingURL=profile.service.js.map