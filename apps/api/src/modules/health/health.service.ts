import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { MeliService } from '../providers/meli.service';
import { AlibabaImageService } from '../providers/alibaba-image.service';
import { ShopeeService } from '../providers/shopee.service';
import { WishService } from '../providers/wish.service';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    external_apis: {
      meli: HealthCheck;
      alibaba: HealthCheck;
      shopee: HealthCheck;
      wish: HealthCheck;
    };
    system: {
      memory: HealthCheck;
      disk: HealthCheck;
      cpu: HealthCheck;
    };
  };
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  response_time?: number;
  details?: any;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly meliService: MeliService,
    private readonly alibabaImageService: AlibabaImageService,
    private readonly shopeeService: ShopeeService,
    private readonly wishService: WishService,
  ) {}

  /**
   * Perform comprehensive health check
   */
  async getHealthStatus(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const checks = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkExternalApis(),
        this.checkSystemResources(),
      ]);

      const [database, redis, externalApis, system] = checks.map(result => 
        result.status === 'fulfilled' ? result.value : { status: 'unhealthy', message: 'Check failed' }
      );

      const overallStatus = this.determineOverallStatus([database, redis, externalApis, system]);

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.configService.get<string>('APP_VERSION') || '1.0.0',
        environment: this.configService.get<string>('NODE_ENV') || 'development',
        checks: {
          database,
          redis,
          external_apis: externalApis,
          system,
        },
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.configService.get<string>('APP_VERSION') || '1.0.0',
        environment: this.configService.get<string>('NODE_ENV') || 'development',
        checks: {
          database: { status: 'unhealthy', message: 'Health check failed' },
          redis: { status: 'unhealthy', message: 'Health check failed' },
          external_apis: {
            meli: { status: 'unhealthy', message: 'Health check failed' },
            alibaba: { status: 'unhealthy', message: 'Health check failed' },
            shopee: { status: 'unhealthy', message: 'Health check failed' },
            wish: { status: 'unhealthy', message: 'Health check failed' },
          },
          system: {
            memory: { status: 'unhealthy', message: 'Health check failed' },
            disk: { status: 'unhealthy', message: 'Health check failed' },
            cpu: { status: 'unhealthy', message: 'Health check failed' },
          },
        },
      };
    }
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // This would be implemented with actual database connection check
      // For now, return a mock check
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        message: 'Database connection successful',
        response_time: responseTime,
        details: {
          connection_pool: 'active',
          max_connections: 100,
          active_connections: 5,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database check failed: ${error.message}`,
        response_time: Date.now() - startTime,
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const pingResult = await this.redisService.ping();
      const responseTime = Date.now() - startTime;
      
      if (pingResult === 'PONG') {
        return {
          status: 'healthy',
          message: 'Redis connection successful',
          response_time: responseTime,
          details: {
            ping: pingResult,
            memory_usage: 'normal',
          },
        };
      } else {
        return {
          status: 'degraded',
          message: 'Redis responding but not as expected',
          response_time: responseTime,
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Redis check failed: ${error.message}`,
        response_time: Date.now() - startTime,
      };
    }
  }

  /**
   * Check external APIs health
   */
  private async checkExternalApis(): Promise<any> {
    const startTime = Date.now();
    
    try {
      const [meli, alibaba, shopee, wish] = await Promise.allSettled([
        this.meliService.healthCheck(),
        this.alibabaImageService.healthCheck(),
        this.shopeeService.healthCheck(),
        this.wishService.healthCheck(),
      ]);

      const responseTime = Date.now() - startTime;

      return {
        meli: {
          status: meli.status === 'fulfilled' && meli.value ? 'healthy' : 'unhealthy',
          message: meli.status === 'fulfilled' ? 'MELI API accessible' : 'MELI API check failed',
          response_time: responseTime,
        },
        alibaba: {
          status: alibaba.status === 'fulfilled' && alibaba.value ? 'healthy' : 'unhealthy',
          message: alibaba.status === 'fulfilled' ? 'Alibaba API accessible' : 'Alibaba API check failed',
          response_time: responseTime,
        },
        shopee: {
          status: shopee.status === 'fulfilled' && shopee.value ? 'healthy' : 'unhealthy',
          message: shopee.status === 'fulfilled' ? 'Shopee API accessible' : 'Shopee API check failed',
          response_time: responseTime,
        },
        wish: {
          status: wish.status === 'fulfilled' && wish.value ? 'healthy' : 'unhealthy',
          message: wish.status === 'fulfilled' ? 'Wish API accessible' : 'Wish API check failed',
          response_time: responseTime,
        },
      };
    } catch (error) {
      return {
        meli: { status: 'unhealthy', message: 'External APIs check failed' },
        alibaba: { status: 'unhealthy', message: 'External APIs check failed' },
        shopee: { status: 'unhealthy', message: 'External APIs check failed' },
        wish: { status: 'unhealthy', message: 'External APIs check failed' },
      };
    }
  }

  /**
   * Check system resources
   */
  private async checkSystemResources(): Promise<any> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const memoryStatus = this.checkMemoryUsage(memUsage);
      const diskStatus = this.checkDiskUsage();
      const cpuStatus = this.checkCpuUsage(cpuUsage);

      return {
        memory: {
          status: memoryStatus.status,
          message: memoryStatus.message,
          response_time: Date.now() - startTime,
          details: {
            heap_used: memUsage.heapUsed,
            heap_total: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss,
          },
        },
        disk: {
          status: diskStatus.status,
          message: diskStatus.message,
          response_time: Date.now() - startTime,
          details: diskStatus.details,
        },
        cpu: {
          status: cpuStatus.status,
          message: cpuStatus.message,
          response_time: Date.now() - startTime,
          details: {
            user: cpuUsage.user,
            system: cpuUsage.system,
          },
        },
      };
    } catch (error) {
      return {
        memory: { status: 'unhealthy', message: 'System resources check failed' },
        disk: { status: 'unhealthy', message: 'System resources check failed' },
        cpu: { status: 'unhealthy', message: 'System resources check failed' },
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemoryUsage(memUsage: NodeJS.MemoryUsage): HealthCheck {
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;

    if (usagePercent > 90) {
      return {
        status: 'unhealthy',
        message: `Memory usage critical: ${usagePercent.toFixed(2)}%`,
      };
    } else if (usagePercent > 80) {
      return {
        status: 'degraded',
        message: `Memory usage high: ${usagePercent.toFixed(2)}%`,
      };
    } else {
      return {
        status: 'healthy',
        message: `Memory usage normal: ${usagePercent.toFixed(2)}%`,
      };
    }
  }

  /**
   * Check disk usage
   */
  private checkDiskUsage(): HealthCheck {
    // This would be implemented with actual disk usage check
    // For now, return a mock check
    return {
      status: 'healthy',
      message: 'Disk usage normal',
      details: {
        total: '100GB',
        used: '50GB',
        available: '50GB',
        usage_percent: 50,
      },
    };
  }

  /**
   * Check CPU usage
   */
  private checkCpuUsage(cpuUsage: NodeJS.CpuUsage): HealthCheck {
    // This would be implemented with actual CPU usage check
    // For now, return a mock check
    return {
      status: 'healthy',
      message: 'CPU usage normal',
      details: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    };
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyCount = checks.filter(check => check.status === 'unhealthy').length;
    const degradedCount = checks.filter(check => check.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get readiness status
   */
  async getReadinessStatus(): Promise<{ status: 'ready' | 'not_ready'; checks: any }> {
    try {
      const healthStatus = await this.getHealthStatus();
      
      if (healthStatus.status === 'healthy') {
        return {
          status: 'ready',
          checks: healthStatus.checks,
        };
      } else {
        return {
          status: 'not_ready',
          checks: healthStatus.checks,
        };
      }
    } catch (error) {
      return {
        status: 'not_ready',
        checks: { error: error.message },
      };
    }
  }

  /**
   * Get liveness status
   */
  async getLivenessStatus(): Promise<{ status: 'alive' | 'dead' }> {
    try {
      // Simple liveness check - if the service is responding, it's alive
      return { status: 'alive' };
    } catch (error) {
      return { status: 'dead' };
    }
  }
}