import { IsNumber } from 'class-validator';
import { CheckInDto } from './check-in.dto';
import { CheckOutDto } from './check-out.dto';

export class GPSCheckInDto extends CheckInDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

export class GPSCheckOutDto extends CheckOutDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
