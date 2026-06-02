import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../repositories/user.repository';
import { StaffProfileRepository } from '../repositories/staff-profile.repository';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffFilterDto } from './dto/staff-filter.dto';
export declare class StaffService {
    private readonly userRepo;
    private readonly profileRepo;
    private readonly configService;
    constructor(userRepo: UserRepository, profileRepo: StaffProfileRepository, configService: ConfigService);
    create(dto: CreateStaffDto): Promise<any>;
    findAll(): any[];
    findById(id: string): any;
    update(id: string, dto: UpdateStaffDto): Promise<any>;
    delete(id: string, actorId: string): void;
    search(query: string): any[];
    filter(dto: StaffFilterDto): any[];
    private _sanitize;
    private _generateEmployeeId;
}
