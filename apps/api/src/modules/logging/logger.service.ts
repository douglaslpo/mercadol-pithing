import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements LoggerService {
  private readonly logger: winston.Logger;
  private readonly isDevelopment: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    
    this.logger = winston.createLogger({
      level: this.configService.get<string>('LOG_LEVEL') || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.prettyPrint()
      ),
      defaultMeta: {
        service: 'mercadol-pithing-api',
        version: this.configService.get<string>('APP_VERSION') || '1.0.0',
        environment: this.configService.get<string>('NODE_ENV') || 'development',
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    });

    // Add request logging middleware
    this.addRequestLogging();
  }

  /**
   * Log a message with context
   */
  log(message: string, context?: string | LogContext): void {
    this.logger.info(message, this.formatContext(context));
  }

  /**
   * Log an error with context
   */
  error(message: string, trace?: string, context?: string | LogContext): void {
    this.logger.error(message, {
      ...this.formatContext(context),
      stack: trace,
    });
  }

  /**
   * Log a warning with context
   */
  warn(message: string, context?: string | LogContext): void {
    this.logger.warn(message, this.formatContext(context));
  }

  /**
   * Log debug information with context
   */
  debug(message: string, context?: string | LogContext): void {
    this.logger.debug(message, this.formatContext(context));
  }

  /**
   * Log verbose information with context
   */
  verbose(message: string, context?: string | LogContext): void {
    this.logger.verbose(message, this.formatContext(context));
  }

  /**
   * Log API request
   */
  logRequest(method: string, url: string, statusCode: number, responseTime: number, context?: LogContext): void {
    this.logger.info('API Request', {
      ...this.formatContext(context),
      type: 'request',
      method,
      url,
      statusCode,
      responseTime,
    });
  }

  /**
   * Log API error
   */
  logError(error: Error, context?: LogContext): void {
    this.logger.error('API Error', {
      ...this.formatContext(context),
      type: 'error',
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, context?: LogContext): void {
    this.logger.debug('Database Query', {
      ...this.formatContext(context),
      type: 'query',
      query,
      duration,
    });
  }

  /**
   * Log external API call
   */
  logExternalApi(service: string, method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    this.logger.info('External API Call', {
      ...this.formatContext(context),
      type: 'external_api',
      service,
      method,
      url,
      statusCode,
      duration,
    });
  }

  /**
   * Log business event
   */
  logEvent(event: string, data: any, context?: LogContext): void {
    this.logger.info('Business Event', {
      ...this.formatContext(context),
      type: 'event',
      event,
      data,
    });
  }

  /**
   * Log performance metric
   */
  logMetric(metric: string, value: number, unit: string, context?: LogContext): void {
    this.logger.info('Performance Metric', {
      ...this.formatContext(context),
      type: 'metric',
      metric,
      value,
      unit,
    });
  }

  /**
   * Log security event
   */
  logSecurity(event: string, data: any, context?: LogContext): void {
    this.logger.warn('Security Event', {
      ...this.formatContext(context),
      type: 'security',
      event,
      data,
    });
  }

  /**
   * Log audit trail
   */
  logAudit(action: string, resource: string, userId: string, data: any, context?: LogContext): void {
    this.logger.info('Audit Trail', {
      ...this.formatContext(context),
      type: 'audit',
      action,
      resource,
      userId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Format context for logging
   */
  private formatContext(context?: string | LogContext): any {
    if (!context) return {};
    
    if (typeof context === 'string') {
      return { context };
    }
    
    return context;
  }

  /**
   * Add request logging middleware
   */
  private addRequestLogging(): void {
    // This would be implemented in the main.ts file
    // to intercept HTTP requests and responses
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): LoggerService {
    const childLogger = this.logger.child(context);
    
    return {
      log: (message: string, childContext?: string | LogContext) => {
        childLogger.info(message, this.formatContext(childContext));
      },
      error: (message: string, trace?: string, childContext?: string | LogContext) => {
        childLogger.error(message, {
          ...this.formatContext(childContext),
          stack: trace,
        });
      },
      warn: (message: string, childContext?: string | LogContext) => {
        childLogger.warn(message, this.formatContext(childContext));
      },
      debug: (message: string, childContext?: string | LogContext) => {
        childLogger.debug(message, this.formatContext(childContext));
      },
      verbose: (message: string, childContext?: string | LogContext) => {
        childLogger.verbose(message, this.formatContext(childContext));
      },
    } as LoggerService;
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.logger.level as LogLevel;
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logger.level = level;
  }

  /**
   * Flush logs (useful for testing)
   */
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}
