import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const startTime = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;

    // Extract real client IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ||
      req.ip ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const userAgent = req.headers['user-agent'] || 'Unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startTime;
          const statusCode = res.statusCode || 200;
          const user = (req as any).user;

          this.auditService.logHttpRequest({
            method,
            url,
            statusCode,
            durationMs,
            ip,
            userAgent,
            userId: user?.id,
            userEmail: user?.email,
          });
        },
        error: (err) => {
          const durationMs = Date.now() - startTime;
          const statusCode = err?.status || err?.statusCode || 500;
          const user = (req as any).user;

          this.auditService.logHttpRequest({
            method,
            url,
            statusCode,
            durationMs,
            ip,
            userAgent,
            userId: user?.id,
            userEmail: user?.email,
            errorMessage: err?.message || 'Request execution error',
          });
        },
      })
    );
  }
}
