import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((value) => {
        const hasEnvelope =
          value && typeof value === 'object' && 'data' in value;
        return {
          success: true,
          message: hasEnvelope ? (value.message ?? 'Success') : 'Success',
          data: hasEnvelope ? value.data : value,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
