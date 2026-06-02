import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
export declare class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(_ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>>;
}
