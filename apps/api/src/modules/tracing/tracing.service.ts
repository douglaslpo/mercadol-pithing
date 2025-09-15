import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { trace, context, SpanStatusCode, SpanKind, Tracer } from '@opentelemetry/api';

export interface TraceContext {
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  baggage?: Record<string, string>;
}

export interface SpanOptions {
  kind?: SpanKind;
  attributes?: Record<string, string | number | boolean>;
  links?: any[];
  startTime?: number;
}

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);
  private readonly tracer: Tracer;
  private readonly serviceName: string;
  private readonly serviceVersion: string;

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get<string>('SERVICE_NAME') || 'mercadol-pithing-api';
    this.serviceVersion = this.configService.get<string>('SERVICE_VERSION') || '1.0.0';
    
    this.tracer = trace.getTracer(this.serviceName, this.serviceVersion);
  }

  /**
   * Start a new span
   */
  startSpan(name: string, options: SpanOptions = {}): any {
    const span = this.tracer.startSpan(name, {
      kind: options.kind || SpanKind.INTERNAL,
      attributes: {
        'service.name': this.serviceName,
        'service.version': this.serviceVersion,
        ...options.attributes,
      },
      links: options.links,
      startTime: options.startTime,
    });

    return span;
  }

  /**
   * Start a span for HTTP requests
   */
  startHttpSpan(method: string, url: string, options: SpanOptions = {}): any {
    return this.startSpan(`${method} ${url}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': method,
        'http.url': url,
        'span.kind': 'client',
        ...options.attributes,
      },
    });
  }

  /**
   * Start a span for database operations
   */
  startDatabaseSpan(operation: string, table: string, options: SpanOptions = {}): any {
    return this.startSpan(`db.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.operation': operation,
        'db.table': table,
        'db.system': 'postgresql',
        'span.kind': 'client',
        ...options.attributes,
      },
    });
  }

  /**
   * Start a span for external API calls
   */
  startExternalApiSpan(service: string, method: string, url: string, options: SpanOptions = {}): any {
    return this.startSpan(`${service}.${method}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': method,
        'http.url': url,
        'external.service': service,
        'span.kind': 'client',
        ...options.attributes,
      },
    });
  }

  /**
   * Start a span for business operations
   */
  startBusinessSpan(operation: string, options: SpanOptions = {}): any {
    return this.startSpan(operation, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'business.operation': operation,
        'span.kind': 'internal',
        ...options.attributes,
      },
    });
  }

  /**
   * Add attributes to a span
   */
  addSpanAttributes(span: any, attributes: Record<string, string | number | boolean>): void {
    if (span && span.setAttributes) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Add an event to a span
   */
  addSpanEvent(span: any, name: string, attributes?: Record<string, string | number | boolean>): void {
    if (span && span.addEvent) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Set span status
   */
  setSpanStatus(span: any, code: SpanStatusCode, message?: string): void {
    if (span && span.setStatus) {
      span.setStatus({ code, message });
    }
  }

  /**
   * End a span
   */
  endSpan(span: any, endTime?: number): void {
    if (span && span.end) {
      span.end(endTime);
    }
  }

  /**
   * Execute a function within a span
   */
  async executeInSpan<T>(
    spanName: string,
    fn: (span: any) => Promise<T>,
    options: SpanOptions = {}
  ): Promise<T> {
    const span = this.startSpan(spanName, options);
    
    try {
      const result = await fn(span);
      this.setSpanStatus(span, SpanStatusCode.OK);
      return result;
    } catch (error) {
      this.setSpanStatus(span, SpanStatusCode.ERROR, error.message);
      this.addSpanAttributes(span, {
        'error.message': error.message,
        'error.type': error.constructor.name,
      });
      throw error;
    } finally {
      this.endSpan(span);
    }
  }

  /**
   * Execute HTTP request within a span
   */
  async executeHttpRequest<T>(
    method: string,
    url: string,
    fn: (span: any) => Promise<T>,
    options: SpanOptions = {}
  ): Promise<T> {
    return this.executeInSpan(`${method} ${url}`, fn, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': method,
        'http.url': url,
        'span.kind': 'client',
        ...options.attributes,
      },
    });
  }

  /**
   * Execute database operation within a span
   */
  async executeDatabaseOperation<T>(
    operation: string,
    table: string,
    fn: (span: any) => Promise<T>,
    options: SpanOptions = {}
  ): Promise<T> {
    return this.executeInSpan(`db.${operation}`, fn, {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.operation': operation,
        'db.table': table,
        'db.system': 'postgresql',
        'span.kind': 'client',
        ...options.attributes,
      },
    });
  }

  /**
   * Execute external API call within a span
   */
  async executeExternalApiCall<T>(
    service: string,
    method: string,
    url: string,
    fn: (span: any) => Promise<T>,
    options: SpanOptions = {}
  ): Promise<T> {
    return this.executeInSpan(`${service}.${method}`, fn, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': method,
        'http.url': url,
        'external.service': service,
        'span.kind': 'client',
        ...options.attributes,
      },
    });
  }

  /**
   * Execute business operation within a span
   */
  async executeBusinessOperation<T>(
    operation: string,
    fn: (span: any) => Promise<T>,
    options: SpanOptions = {}
  ): Promise<T> {
    return this.executeInSpan(operation, fn, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'business.operation': operation,
        'span.kind': 'internal',
        ...options.attributes,
      },
    });
  }

  /**
   * Get current trace context
   */
  getCurrentTraceContext(): TraceContext {
    const activeSpan = trace.getActiveSpan();
    if (!activeSpan) {
      return {};
    }

    const spanContext = activeSpan.spanContext();
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  }

  /**
   * Set baggage in trace context
   */
  setBaggage(key: string, value: string): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.setAttributes({ [`baggage.${key}`]: value });
    }
  }

  /**
   * Get baggage from trace context
   */
  getBaggage(key: string): string | undefined {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      const attributes = activeSpan.attributes();
      return attributes[`baggage.${key}`] as string;
    }
    return undefined;
  }

  /**
   * Create a child span
   */
  createChildSpan(parentSpan: any, name: string, options: SpanOptions = {}): any {
    const span = this.tracer.startSpan(name, {
      kind: options.kind || SpanKind.INTERNAL,
      attributes: {
        'service.name': this.serviceName,
        'service.version': this.serviceVersion,
        ...options.attributes,
      },
    });

    return span;
  }

  /**
   * Get tracer instance
   */
  getTracer(): Tracer {
    return this.tracer;
  }

  /**
   * Get service name
   */
  getServiceName(): string {
    return this.serviceName;
  }

  /**
   * Get service version
   */
  getServiceVersion(): string {
    return this.serviceVersion;
  }
}
