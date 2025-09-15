import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { EmbeddingsService } from '../services/embeddings.service';
import { ProvidersModule } from '../providers/providers.module';
import { RankingsModule } from '../rankings/rankings.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'search-processing',
    }),
    ProvidersModule,
    RankingsModule,
  ],
  controllers: [SearchController],
  providers: [
    SearchService,
    EmbeddingsService,
  ],
  exports: [SearchService],
})
export class SearchModule {}
