import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    this.redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    try {
      await this.redis.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.redis.set(key, value);
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    try {
      await this.redis.setex(key, seconds, value);
    } catch (error) {
      this.logger.error(`Error setting key ${key} with expiration:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.redis.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Error setting expiration for key ${key}:`, error);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.redis.hget(key, field);
    } catch (error) {
      this.logger.error(`Error getting hash field ${field} from key ${key}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.redis.hset(key, field, value);
    } catch (error) {
      this.logger.error(`Error setting hash field ${field} for key ${key}:`, error);
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.redis.hgetall(key);
    } catch (error) {
      this.logger.error(`Error getting all hash fields for key ${key}:`, error);
      return {};
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    try {
      await this.redis.hdel(key, field);
    } catch (error) {
      this.logger.error(`Error deleting hash field ${field} from key ${key}:`, error);
    }
  }

  async lpush(key: string, ...values: string[]): Promise<void> {
    try {
      await this.redis.lpush(key, ...values);
    } catch (error) {
      this.logger.error(`Error pushing to list ${key}:`, error);
    }
  }

  async rpush(key: string, ...values: string[]): Promise<void> {
    try {
      await this.redis.rpush(key, ...values);
    } catch (error) {
      this.logger.error(`Error pushing to list ${key}:`, error);
    }
  }

  async lpop(key: string): Promise<string | null> {
    try {
      return await this.redis.lpop(key);
    } catch (error) {
      this.logger.error(`Error popping from list ${key}:`, error);
      return null;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.redis.rpop(key);
    } catch (error) {
      this.logger.error(`Error popping from list ${key}:`, error);
      return null;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redis.lrange(key, start, stop);
    } catch (error) {
      this.logger.error(`Error getting range from list ${key}:`, error);
      return [];
    }
  }

  async sadd(key: string, ...members: string[]): Promise<void> {
    try {
      await this.redis.sadd(key, ...members);
    } catch (error) {
      this.logger.error(`Error adding to set ${key}:`, error);
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      this.logger.error(`Error getting set members ${key}:`, error);
      return [];
    }
  }

  async srem(key: string, ...members: string[]): Promise<void> {
    try {
      await this.redis.srem(key, ...members);
    } catch (error) {
      this.logger.error(`Error removing from set ${key}:`, error);
    }
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    try {
      await this.redis.zadd(key, score, member);
    } catch (error) {
      this.logger.error(`Error adding to sorted set ${key}:`, error);
    }
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redis.zrange(key, start, stop);
    } catch (error) {
      this.logger.error(`Error getting range from sorted set ${key}:`, error);
      return [];
    }
  }

  async zrem(key: string, ...members: string[]): Promise<void> {
    try {
      await this.redis.zrem(key, ...members);
    } catch (error) {
      this.logger.error(`Error removing from sorted set ${key}:`, error);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      return await this.redis.decr(key);
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}:`, error);
      return 0;
    }
  }

  async incrby(key: string, increment: number): Promise<number> {
    try {
      return await this.redis.incrby(key, increment);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key} by ${increment}:`, error);
      return 0;
    }
  }

  async decrby(key: string, decrement: number): Promise<number> {
    try {
      return await this.redis.decrby(key, decrement);
    } catch (error) {
      this.logger.error(`Error decrementing key ${key} by ${decrement}:`, error);
      return 0;
    }
  }

  async flushdb(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      this.logger.error('Error flushing database:', error);
    }
  }

  async flushall(): Promise<void> {
    try {
      await this.redis.flushall();
    } catch (error) {
      this.logger.error('Error flushing all databases:', error);
    }
  }

  async ping(): Promise<string> {
    try {
      return await this.redis.ping();
    } catch (error) {
      this.logger.error('Error pinging Redis:', error);
      return 'PONG';
    }
  }

  async info(): Promise<string> {
    try {
      return await this.redis.info();
    } catch (error) {
      this.logger.error('Error getting Redis info:', error);
      return '';
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  async scan(cursor: string, pattern?: string, count?: number): Promise<[string, string[]]> {
    try {
      const args: any[] = [cursor];
      if (pattern) args.push('MATCH', pattern);
      if (count) args.push('COUNT', count);
      
      return await this.redis.scan(...args);
    } catch (error) {
      this.logger.error('Error scanning keys:', error);
      return ['0', []];
    }
  }

  getClient(): Redis {
    return this.redis;
  }
}
