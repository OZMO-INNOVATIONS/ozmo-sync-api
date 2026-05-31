import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong';
    let errors: unknown[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exBody = exception.getResponse();

      if (typeof exBody === 'string') {
        message = exBody;
      } else if (typeof exBody === 'object' && exBody !== null) {
        const body = exBody as Record<string, unknown>;
        if (Array.isArray(body.message)) {
          errors = body.message as string[];
          message = 'Validation failed';
        } else {
          message = (body.message as string) || message;
        }
      }
    }

    if (statusCode >= 500) {
      console.error(`[ERROR] ${request.method} ${request.url} → ${statusCode}`, exception);
    }

    const body: Record<string, unknown> = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) body.errors = errors;

    if (
      this.configService.get('NODE_ENV') === 'development' &&
      exception instanceof Error
    ) {
      body.stack = exception.stack;
    }

    response.status(statusCode).json(body);
  }
}
