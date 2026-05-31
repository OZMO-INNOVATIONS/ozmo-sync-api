import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Standard API success response shape matching the demo spec.
 */
export interface ApiResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  [key: string]: unknown; // allow extra properties (app, env, etc.)
}

/**
 * Transforms all successful controller responses into the uniform shape:
 *
 *   { success: true, message: "...", data?: ..., timestamp: "..." }
 *
 * Controllers may return a partial shape (e.g. { message, data, app, env })
 * which will have `success: true` and `timestamp` appended automatically.
 * All extra properties from the controller response are preserved.
 *
 * Exceptions and errors are handled separately by the global exception filter.
 */
@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        const timestamp = new Date().toISOString();

        // Wrap raw (non-object) values in the standard envelope.
        if (!payload || typeof payload !== 'object') {
          return {
            success: true,
            message: 'Success',
            ...(payload !== undefined && { data: payload as T }),
            timestamp,
          } as ApiResponse<T>;
        }

        // If the controller already returned a structured response, keep all
        // its properties and add success + timestamp.
        if ('message' in payload) {
          const { message, data, ...extra } = payload as Record<string, unknown>;
          return {
            success: true,
            message: message as string,
            ...extra,
            ...(data !== undefined && { data: data as T }),
            timestamp,
          } as ApiResponse<T>;
        }

        // Plain object with no message — wrap fully.
        return {
          success: true,
          message: 'Success',
          data: payload as T,
          timestamp,
        } as ApiResponse<T>;
      }),
    );
  }
}
