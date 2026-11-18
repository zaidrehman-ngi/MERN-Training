import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const start = performance.now();

    const log = (status: number) => {
      const ms = (performance.now() - start).toFixed(1);
      this.logger.log(`${req.method} ${req.originalUrl} ${status} ${ms}ms`);
    };

    return next.handle().pipe(
      tap({
        next: () => log(res.statusCode),
        error: (err: unknown) =>
          log(err instanceof HttpException ? err.getStatus() : 500),
      }),
    );
  }
}
