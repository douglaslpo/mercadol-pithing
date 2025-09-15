import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import { SearchModule } from './modules/search/search.module';
import { RankingsModule } from './modules/rankings/rankings.module';
import { ProductsModule } from './modules/products/products.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { ValidationModule } from './modules/validation/validation.module';
import { HealthModule } from './modules/health/health.module';
import { RedisModule } from './modules/redis/redis.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { LoggingModule } from './modules/logging/logging.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { TracingModule } from './modules/tracing/tracing.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Job queues
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Core modules
    RedisModule,
    ProvidersModule,

    // Observability modules
    LoggingModule,
    MetricsModule,
    TracingModule,

    // Feature modules
    SearchModule,
    RankingsModule,
    ProductsModule,
    MerchantsModule,
    ValidationModule,
    HealthModule,
  ],
})
export class AppModule {}
