import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Métricas Prometheus da API' })
  @ApiResponse({
    status: 200,
    description: 'Métricas em formato Prometheus',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: '# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="GET",route="/health",status="200"} 10',
        },
      },
    },
  })
  async getMetrics() {
    this.logger.log('Metrics requested');
    return this.metricsService.getMetrics();
  }
}
