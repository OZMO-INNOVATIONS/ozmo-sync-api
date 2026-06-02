import { Controller, All, Req, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class FallbackController {
  @Public()
  @All('*')
  handleNotFound(@Req() req: Request): never {
    throw new NotFoundException(
      `Route ${req.method} ${req.originalUrl} not found`,
    );
  }
}
