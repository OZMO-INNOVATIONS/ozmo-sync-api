import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { configuration } from '../../config/configuration';

const config = configuration();

interface ValidationErrorDetail {
  field: string;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const timestamp = new Date().toISOString();

    let status: number;
    let message: string;
    let errors: ValidationErrorDetail[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;

        if (Array.isArray(resp.message)) {
          const firstItem = resp.message[0];
          if (
            typeof firstItem === 'object' &&
            firstItem !== null &&
            'property' in (firstItem as Record<string, unknown>)
          ) {
            errors = resp.message.map((err: unknown) => {
              const e = err as Record<string, unknown>;
              const constraints = e.constraints as Record<string, string> | undefined;
              const firstConstraint = constraints
                ? Object.values(constraints)[0]
                : 'Invalid value';
              return { field: e.property as string, message: firstConstraint };
            });
            message = 'Validation failed';
          } else {
            message = (resp.message as string[]).join('; ');
          }
        } else {
          message = (resp.message as string) || exception.message;
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message =
        config.nodeEnv === 'production' ? 'Something went wrong' : exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Something went wrong';
    }

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} — ${status} ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    let errorCode = 'INTERNAL_SERVER_ERROR';
    if (status === HttpStatus.BAD_REQUEST) errorCode = 'BAD_REQUEST';
    else if (status === HttpStatus.UNAUTHORIZED) errorCode = 'UNAUTHORIZED';
    else if (status === HttpStatus.FORBIDDEN) errorCode = 'FORBIDDEN';
    else if (status === HttpStatus.NOT_FOUND) errorCode = 'NOT_FOUND';
    else if (status === HttpStatus.CONFLICT) {
      errorCode = message === 'REQUEST_ALREADY_IN_PROGRESS' ? 'REQUEST_ALREADY_IN_PROGRESS' : 'CONFLICT';
    }

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        if (typeof resp.errorCode === 'string') {
          errorCode = resp.errorCode;
        } else if (typeof resp.message === 'string' && /^[A-Z0-9_]+$/.test(resp.message)) {
          errorCode = resp.message;
        }
      }
    }
    if (/^[A-Z0-9_]+$/.test(message)) {
      errorCode = message;
    }

    const body: Record<string, unknown> = { success: false, message, timestamp, errorCode };
    if (errors) body.errors = errors;

    response.status(status).json(body);
  }
}
