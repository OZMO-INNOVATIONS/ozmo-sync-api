import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateStaffDto } from './create-staff.dto';
import { UserStatus } from '../../common/constants/roles.enum';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
