import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { configuration } from '../../config/configuration';

const config = configuration();

/**
 * HealthController
 *
 * Exposes a simple health check endpoint at /health.
 * This route is excluded from the global /api/v1 prefix in main.ts so it
 * remains accessible at the root level for load balancers and monitoring.
 *
 * Response format matches the demo spec (flat structure — no 'data' envelope):
 *   { success: true, message: "Service is healthy", app: "...", env: "...", timestamp: "..." }
 */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    return {
      message: 'Service is healthy',
      app: config.appName,
      env: config.nodeEnv,
    };
  }
}
