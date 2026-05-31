import { Module } from '@nestjs/common';
import { FallbackController } from './fallback.controller';

/**
 * CommonModule
 *
 * Registers cross-cutting controllers and providers that don't belong to
 * a specific feature module, like the 404 fallback route handler.
 */
@Module({
  controllers: [FallbackController],
})
export class CommonModule {}
