import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Healthcheck da API' })
  @ApiResponse({
    status: 200,
    description: 'Status da API e serviços dependentes',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'development' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'object' },
            redis: { type: 'object' },
            external_apis: { type: 'object' },
            system: { type: 'object' },
          },
        },
      },
    },
  })
  async getHealth() {
    return this.healthService.getHealthStatus();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check da API' })
  @ApiResponse({
    status: 200,
    description: 'Status de readiness da API',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ready' },
        checks: { type: 'object' },
      },
    },
  })
  async getReadiness() {
    return this.healthService.getReadinessStatus();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check da API' })
  @ApiResponse({
    status: 200,
    description: 'Status de liveness da API',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'alive' },
      },
    },
  })
  async getLiveness() {
    return this.healthService.getLivenessStatus();
  }
}
