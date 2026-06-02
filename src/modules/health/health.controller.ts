import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { configuration } from '../../config/configuration';

const config = configuration();

@Controller({ path: 'health', version: '1' })
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
