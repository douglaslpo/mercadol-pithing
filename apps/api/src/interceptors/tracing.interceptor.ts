import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TracingService } from '../modules/tracing/tracing.service';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TracingInterceptor.name);

  constructor(private readonly tracingService: TracingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const spanName = `${method} ${url}`;

    const span = this.tracingService.startSpan(spanName, {
      attributes: {
        'http.method': method,
        'http.url': url,
        'http.route': request.route?.path || url,
        'http.user_agent': request.get('User-Agent') || '',
        'http.request_id': request.get('X-Request-ID') || '',
      },
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          span.setAttributes({
            'http.status_code': 200,
            'http.response_size': JSON.stringify(data).length,
          });
          span.end();
        },
        error: (error) => {
          span.setAttributes({
            'http.status_code': error.status || 500,
            'error.message': error.message,
            'error.stack': error.stack,
          });
          span.end();
        },
      }),
    );
  }
}
