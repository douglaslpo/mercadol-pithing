import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../modules/logging/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') || '';
    const requestId = request.get('X-Request-ID') || '';
    const startTime = Date.now();

    this.loggerService.log({
      message: 'Request started',
      method,
      url,
      userAgent,
      requestId,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.loggerService.log({
            message: 'Request completed',
            method,
            url,
            status: 200,
            duration,
            requestId,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.loggerService.error({
            message: 'Request failed',
            method,
            url,
            status: error.status || 500,
            duration,
            error: error.message,
            stack: error.stack,
            requestId,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }
}
