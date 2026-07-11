import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, UnprocessableEntityException } from '@nestjs/common';
import helmet from 'helmet';
import * as morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import * as express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { configuration } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const config = configuration();

  app.use(helmet());

  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  });

  app.use(
    rateLimit({
      windowMs: config.rateLimit.global.windowMs,
      max: config.rateLimit.global.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests — please try again later' },
    }),
  );

  app.use(
    '/api/v1/auth/login',
    rateLimit({
      windowMs: config.rateLimit.login.windowMs,
      max: config.rateLimit.login.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many login attempts — please try again in 15 minutes',
      },
    }),
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => new UnprocessableEntityException(errors),
    }),
  );

  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(config.port);
  console.log(`[OZMO SYNC] Running on http://localhost:${config.port}/api/v1`);
}

bootstrap();
