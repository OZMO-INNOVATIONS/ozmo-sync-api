import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * HealthModule
 *
 * Provides a simple health check endpoint for monitoring and load balancers.
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
