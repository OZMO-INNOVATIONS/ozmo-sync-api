import { Controller, All, Req, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';

/**
 * FallbackController
 *
 * Catches all unmatched routes and throws a NotFoundException.
 * The global HttpExceptionFilter formats this into the demo spec shape:
 *   { success: false, message: "Route GET /api/v1/unknown not found", timestamp }
 */
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
