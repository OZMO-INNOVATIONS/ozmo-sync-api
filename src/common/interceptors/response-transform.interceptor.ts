import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  [key: string]: unknown;
}

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

        if (!payload || typeof payload !== 'object') {
          return {
            success: true,
            message: 'Success',
            ...(payload !== undefined && { data: payload as T }),
            timestamp,
          } as ApiResponse<T>;
        }

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
