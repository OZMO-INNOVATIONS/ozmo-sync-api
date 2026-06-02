import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffFilterDto, StaffSearchDto } from './dto/staff-filter.dto';
import { RequestUser } from '../common/interfaces/request-user.interface';
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    createStaff(dto: CreateStaffDto): Promise<{
        message: string;
        data: any;
    }>;
    listStaff(): {
        message: string;
        data: any[];
    };
    searchStaff(query: StaffSearchDto): {
        message: string;
        data: any[];
    };
    filterStaff(dto: StaffFilterDto): {
        message: string;
        data: any[];
    };
    getStaffById(id: string): {
        message: string;
        data: any;
    };
    updateStaff(id: string, dto: UpdateStaffDto): Promise<{
        message: string;
        data: any;
    }>;
    deleteStaff(id: string, actor: RequestUser): {
        message: string;
        data: {};
    };
}
