import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Counter, Histogram, Gauge, register } from 'prom-client';

export interface MetricLabels {
  [key: string]: string | number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly metrics: Map<string, Counter | Histogram | Gauge> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeMetrics();
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): void {
    // HTTP Request Metrics
    this.createCounter('http_requests_total', 'Total number of HTTP requests', ['method', 'route', 'status_code']);
    this.createHistogram('http_request_duration_seconds', 'HTTP request duration in seconds', ['method', 'route']);
    
    // Database Metrics
    this.createCounter('database_queries_total', 'Total number of database queries', ['operation', 'table']);
    this.createHistogram('database_query_duration_seconds', 'Database query duration in seconds', ['operation', 'table']);
    
    // External API Metrics
    this.createCounter('external_api_requests_total', 'Total number of external API requests', ['service', 'method', 'status_code']);
    this.createHistogram('external_api_duration_seconds', 'External API duration in seconds', ['service', 'method']);
    
    // Business Metrics
    this.createCounter('products_searched_total', 'Total number of product searches', ['marketplace', 'query_type']);
    this.createCounter('products_found_total', 'Total number of products found', ['marketplace', 'category']);
    this.createCounter('rankings_calculated_total', 'Total number of rankings calculated', ['niche']);
    
    // Error Metrics
    this.createCounter('errors_total', 'Total number of errors', ['type', 'service']);
    
    // Performance Metrics
    this.createGauge('active_connections', 'Number of active connections');
    this.createGauge('memory_usage_bytes', 'Memory usage in bytes');
    this.createGauge('cpu_usage_percent', 'CPU usage percentage');
    
    // Cache Metrics
    this.createCounter('cache_hits_total', 'Total number of cache hits', ['cache_type']);
    this.createCounter('cache_misses_total', 'Total number of cache misses', ['cache_type']);
    this.createGauge('cache_size_bytes', 'Cache size in bytes', ['cache_type']);
    
    // Queue Metrics
    this.createCounter('queue_jobs_total', 'Total number of queue jobs', ['queue', 'status']);
    this.createGauge('queue_size', 'Queue size', ['queue']);
    
    this.logger.log('Metrics initialized');
  }

  /**
   * Create a counter metric
   */
  createCounter(name: string, help: string, labelNames: string[] = []): Counter {
    if (this.metrics.has(name)) {
      return this.metrics.get(name) as Counter;
    }

    const counter = new Counter({
      name,
      help,
      labelNames,
      registers: [register],
    });

    this.metrics.set(name, counter);
    return counter;
  }

  /**
   * Create a histogram metric
   */
  createHistogram(name: string, help: string, labelNames: string[] = []): Histogram {
    if (this.metrics.has(name)) {
      return this.metrics.get(name) as Histogram;
    }

    const histogram = new Histogram({
      name,
      help,
      labelNames,
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
      registers: [register],
    });

    this.metrics.set(name, histogram);
    return histogram;
  }

  /**
   * Create a gauge metric
   */
  createGauge(name: string, help: string, labelNames: string[] = []): Gauge {
    if (this.metrics.has(name)) {
      return this.metrics.get(name) as Gauge;
    }

    const gauge = new Gauge({
      name,
      help,
      labelNames,
      registers: [register],
    });

    this.metrics.set(name, gauge);
    return gauge;
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, labels: MetricLabels = {}): void {
    const counter = this.metrics.get(name) as Counter;
    if (counter) {
      counter.inc(labels);
    }
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels: MetricLabels = {}): void {
    const histogram = this.metrics.get(name) as Histogram;
    if (histogram) {
      histogram.observe(labels, value);
    }
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels: MetricLabels = {}): void {
    const gauge = this.metrics.get(name) as Gauge;
    if (gauge) {
      gauge.set(labels, value);
    }
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.incrementCounter('http_requests_total', {
      method,
      route,
      status_code: statusCode.toString(),
    });
    
    this.recordHistogram('http_request_duration_seconds', duration / 1000, {
      method,
      route,
    });
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(operation: string, table: string, duration: number): void {
    this.incrementCounter('database_queries_total', {
      operation,
      table,
    });
    
    this.recordHistogram('database_query_duration_seconds', duration / 1000, {
      operation,
      table,
    });
  }

  /**
   * Record external API call metrics
   */
  recordExternalApiCall(service: string, method: string, statusCode: number, duration: number): void {
    this.incrementCounter('external_api_requests_total', {
      service,
      method,
      status_code: statusCode.toString(),
    });
    
    this.recordHistogram('external_api_duration_seconds', duration / 1000, {
      service,
      method,
    });
  }

  /**
   * Record product search metrics
   */
  recordProductSearch(marketplace: string, queryType: string, productsFound: number): void {
    this.incrementCounter('products_searched_total', {
      marketplace,
      query_type: queryType,
    });
    
    this.incrementCounter('products_found_total', {
      marketplace,
      category: 'all',
    }, productsFound);
  }

  /**
   * Record ranking calculation metrics
   */
  recordRankingCalculation(niche: string, listingsCount: number): void {
    this.incrementCounter('rankings_calculated_total', {
      niche,
    }, listingsCount);
  }

  /**
   * Record error metrics
   */
  recordError(type: string, service: string): void {
    this.incrementCounter('errors_total', {
      type,
      service,
    });
  }

  /**
   * Record cache metrics
   */
  recordCacheHit(cacheType: string): void {
    this.incrementCounter('cache_hits_total', {
      cache_type: cacheType,
    });
  }

  recordCacheMiss(cacheType: string): void {
    this.incrementCounter('cache_misses_total', {
      cache_type: cacheType,
    });
  }

  /**
   * Record queue metrics
   */
  recordQueueJob(queue: string, status: string): void {
    this.incrementCounter('queue_jobs_total', {
      queue,
      status,
    });
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.setGauge('memory_usage_bytes', memUsage.heapUsed);
    this.setGauge('active_connections', 0); // Would be updated by connection pool
  }

  /**
   * Get all metrics as string
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Get specific metric
   */
  getMetric(name: string): Counter | Histogram | Gauge | undefined {
    return this.metrics.get(name);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    register.clear();
    this.metrics.clear();
    this.initializeMetrics();
  }

  /**
   * Get metrics summary
   */
  async getMetricsSummary(): Promise<any> {
    const metrics = await register.getMetricsAsJSON();
    const summary = {
      total_metrics: metrics.length,
      metrics_by_type: {
        counter: 0,
        histogram: 0,
        gauge: 0,
      },
      metrics_list: metrics.map(metric => ({
        name: metric.name,
        help: metric.help,
        type: metric.type,
        labels: metric.labelNames,
      })),
    };

    metrics.forEach(metric => {
      summary.metrics_by_type[metric.type]++;
    });

    return summary;
  }
}
