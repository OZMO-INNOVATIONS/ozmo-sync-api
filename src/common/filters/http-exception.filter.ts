import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { configuration } from '../../config/configuration';

const config = configuration();

/**
 * Shape of a single validation error, as shown in the demo spec.
 */
interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Global exception filter.
 *
 * Catches every thrown exception (HttpException or otherwise) and returns a
 * consistent JSON error response matching the demo spec:
 *
 *   Simple errors:  { success: false, message: "...", timestamp: "..." }
 *   Validation:     { success: false, message: "Validation failed",
 *                      errors: [{ field, message }], timestamp: "..." }
 */
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

        // NestJS ValidationPipe returns { message: [ { property, constraints } ], error, statusCode }
        if (Array.isArray(resp.message)) {
          // Check if it's a NestJS validation error array
          const firstItem = resp.message[0];
          if (
            typeof firstItem === 'object' &&
            firstItem !== null &&
            'property' in (firstItem as Record<string, unknown>)
          ) {
            // Transform into the demo spec format: { field, message }[]
            errors = resp.message.map((err: unknown) => {
              const e = err as Record<string, unknown>;
              const constraints = e.constraints as Record<string, string> | undefined;
              const firstConstraint = constraints
                ? Object.values(constraints)[0]
                : 'Invalid value';
              return {
                field: e.property as string,
                message: firstConstraint,
              };
            });
            message = 'Validation failed';
          } else {
            // Plain string array — join into a single message
            message = (resp.message as string[]).join('; ');
          }
        } else {
          message = (resp.message as string) || exception.message;
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      // Unexpected / programming errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message =
        config.nodeEnv === 'production'
          ? 'Something went wrong'
          : exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Something went wrong';
    }

    // Log all 5xx errors for debugging
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} — ${status} ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const errorBody: Record<string, unknown> = {
      success: false,
      message,
      timestamp,
    };

    if (errors) {
      errorBody.errors = errors;
    }

    response.status(status).json(errorBody);
  }
}
