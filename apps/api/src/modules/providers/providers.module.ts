import { Module } from '@nestjs/common';
import { MeliService } from './meli.service';
import { AlibabaImageService } from './alibaba-image.service';
import { ShopeeService } from './shopee.service';
import { WishService } from './wish.service';
import { ProvidersController } from './providers.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [ProvidersController],
  providers: [MeliService, AlibabaImageService, ShopeeService, WishService],
  exports: [MeliService, AlibabaImageService, ShopeeService, WishService],
})
export class ProvidersModule {}
