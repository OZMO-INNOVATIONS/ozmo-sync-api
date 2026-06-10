import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import * as crypto from 'crypto';

@Injectable()
export class RequestLockInterceptor implements NestInterceptor {
  private activeLocks = new Set<string>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    // Only lock mutating requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const userId = user?.id || 'anonymous';
      // Compute md5 hash of body to allow different parallel requests to the same endpoint
      const bodyHash = crypto.createHash('md5').update(JSON.stringify(body || {})).digest('hex');
      const lockKey = `${userId}:${method}:${url}:${bodyHash}`;

      if (this.activeLocks.has(lockKey)) {
        throw new ConflictException('REQUEST_ALREADY_IN_PROGRESS');
      }

      this.activeLocks.add(lockKey);

      return next.handle().pipe(
        finalize(() => {
          this.activeLocks.delete(lockKey);
        }),
      );
    }

    return next.handle();
  }
}
