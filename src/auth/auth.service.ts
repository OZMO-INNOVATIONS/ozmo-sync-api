import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UserRepository, UserEntity } from '../repositories/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, UserStatus } from '../common/constants/roles.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);
    const employeeId = await this._generateEmployeeId();

    const user = await this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      role: dto.role ?? Role.STAFF,
      designation: dto.designation,
      department: dto.department,
      employeeId,
      status: UserStatus.ACTIVE,
      refreshToken: null,
    });

    const tokens = await this._issueTokens(user);
    return { ...tokens, user: this._sanitize(user) };
  }

  async login(dto: LoginDto) {
    if (!dto.email && !dto.employeeId) {
      throw new BadRequestException('Provide either email or employeeId');
    }

    const user = dto.email
      ? await this.userRepo.findByEmail(dto.email)
      : await this.userRepo.findByEmployeeId(dto.employeeId!);

    const isMatch = user ? await bcrypt.compare(dto.password, user.password) : false;
    if (!user || !isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const tokens = await this._issueTokens(user);
    return { ...tokens, user: this._sanitize(user) };
  }

  async refresh(rawToken: string) {
    let payload: { sub: string };
    try {
      payload = jwt.verify(
        rawToken,
        this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-jwt-refresh-secret-key-do-not-use-in-production-123456789',
      ) as { sub: string };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user?.refreshToken) {
      throw new UnauthorizedException('Refresh token not recognised — please log in again');
    }

    const isMatch = await bcrypt.compare(rawToken, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token mismatch — possible reuse detected');
    }

    const tokens = await this._issueTokens(user);
    return { ...tokens, user: this._sanitize(user) };
  }

  async logout(userId: string): Promise<void> {
    await this.userRepo.saveRefreshToken(userId, null);
  }

  private async _issueTokens(user: UserEntity) {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    const accessToken = this.jwtService.sign(jwtPayload);

    const refreshToken = jwt.sign(
      { sub: user.id },
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-jwt-refresh-secret-key-do-not-use-in-production-123456789',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES', '7d') as any,
        algorithm: 'HS256',
      },
    );

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.saveRefreshToken(user.id, hashedRefresh);

    return { accessToken, refreshToken };
  }

  private _sanitize(user: UserEntity) {
    const { password, refreshToken, ...safe } = user;
    void password; void refreshToken;
    return safe;
  }

  private async _generateEmployeeId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = (await this.userRepo.count()) + 1;
    return `OZ-${year}-${String(count).padStart(4, '0')}`;
  }
}
