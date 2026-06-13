import { IsString } from 'class-validator';
import { CheckInDto } from './check-in.dto';
import { CheckOutDto } from './check-out.dto';

export class FaceCheckInDto extends CheckInDto {
  @IsString()
  facePhoto: string;
}

export class FaceCheckOutDto extends CheckOutDto {
  @IsString()
  facePhoto: string;
}
