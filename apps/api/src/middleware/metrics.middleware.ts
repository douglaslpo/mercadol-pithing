import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../modules/metrics/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MetricsMiddleware.name);

  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const method = req.method;
    const route = req.route?.path || req.path;

    // Increment request counter
    this.metricsService.httpRequestsTotal.inc({
      method,
      route,
      status: 'pending',
    });

    // Override res.end to capture response status
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const status = res.statusCode.toString();
      const duration = (Date.now() - startTime) / 1000;

      // Update metrics
      this.metricsService.httpRequestsTotal.inc({
        method,
        route,
        status,
      });

      this.metricsService.httpRequestDurationSeconds.observe(
        {
          method,
          route,
          status,
        },
        duration,
      );

      // Call original end
      originalEnd.call(this, chunk, encoding);
    }.bind(this);

    next();
  }
}
