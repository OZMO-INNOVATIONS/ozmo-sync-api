import { CreateStaffDto } from './create-staff.dto';
import { UserStatus } from '../../common/constants/roles.enum';
declare const UpdateStaffDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateStaffDto>>;
export declare class UpdateStaffDto extends UpdateStaffDto_base {
    status?: UserStatus;
}
export {};
