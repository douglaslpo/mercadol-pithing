import { Module } from '@nestjs/common';
import { RankingsController } from './rankings.controller';
import { RankingService } from '../../services/ranking.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [RankingsController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingsModule {}
