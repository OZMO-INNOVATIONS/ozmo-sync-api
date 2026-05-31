import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { configuration } from './config/configuration';

/**
 * Bootstrap the NestJS application.
 *
 * 1. Creates the NestJS HTTP server.
 * 2. Wires Express middleware (helmet, morgan, rate-limit).
 * 3. Registers the global ValidationPipe for DTO validation.
 * 4. Seeds mock users if configured.
 * 5. Starts listening on the configured port.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = configuration();
  const logger = new Logger('Bootstrap');

  // ─── Global NestJS Pipes ───────────────────────────────────────────────

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                        // strip unknown properties
      forbidNonWhitelisted: true,             // throw error on unknown properties
      transform: true,                        // auto-transform types
      // Match demo spec: validation errors → 422 Unprocessable Entity
      exceptionFactory: (errors) => {
        return new UnprocessableEntityException(errors);
      },
    }),
  );

  // ─── Set global prefix ─────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'], // health check stays at root
  });

  // ─── Express Middleware ─────────────────────────────────────────────────

  app.use(helmet());

  app.enableCors({
    origin: config.corsOrigin,
    credentials: true,
  });

  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }

  // ─── Rate Limiting ─────────────────────────────────────────────────────

  app.use(
    rateLimit({
      windowMs: config.rateLimit.global.windowMs,
      max: config.rateLimit.global.max,
      message: {
        success: false,
        message:
          'Too many authentication attempts — please try again in 15 minutes',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(
    '/api/v1/auth/login',
    rateLimit({
      windowMs: config.rateLimit.login.windowMs,
      max: config.rateLimit.login.max,
      message: {
        success: false,
        message:
          'Too many authentication attempts — please try again in 15 minutes',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // ─── Seed data ─────────────────────────────────────────────────────────

  if (config.seedUsers) {
    const usersService = app.get(UsersService);
    await usersService.seed();
    logger.log('Mock users loaded into memory');
    logger.log('  alice@ozmo.io / Password@123 (admin)');
    logger.log('  bob@ozmo.io / Password@123    (user)');
    logger.log('  super@example.com / super123  (superadmin)');
    logger.log('  blocked@example.com / blocked123 (blocked)');
  }

  // ─── Start server ─────────────────────────────────────────────────────

  await app.listen(config.port);
  logger.log(`Running in ${config.nodeEnv} mode on port ${config.port}`);
  logger.log(`Health check: GET http://localhost:${config.port}/health`);
  logger.log(`Login:        POST http://localhost:${config.port}/api/v1/auth/login`);
  logger.log(`Profile:      GET http://localhost:${config.port}/api/v1/user/profile`);
}

void bootstrap();
