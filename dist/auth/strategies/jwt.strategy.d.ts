import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { UserRepository } from '../../repositories/user.repository';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly userRepository;
    constructor(configService: ConfigService, userRepository: UserRepository);
    validate(payload: JwtPayload): Promise<RequestUser>;
}
export {};
