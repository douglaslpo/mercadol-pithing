import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { SearchTextDto, SearchImageDto } from './dto/search.dto';
import { MeliService } from '../providers/meli.service';
import { AlibabaImageService } from '../providers/alibaba-image.service';
import { ShopeeService } from '../providers/shopee.service';
import { WishService } from '../providers/wish.service';
import { EmbeddingsService } from '../services/embeddings.service';
import { RankingService } from '../services/ranking.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly meliService: MeliService,
    private readonly alibabaImageService: AlibabaImageService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly rankingService: RankingService,
  ) {}

  async searchByText(query: SearchTextDto) {
    this.logger.log(`Buscando por texto: ${query.q}`);

    const startTime = Date.now();
    const results = [];

    try {
      // Busca no Mercado Livre (público)
      const meliResults = await this.meliService.searchPublic({
        q: query.q,
        category: query.niche,
        price_min: query.price_min,
        price_max: query.price_max,
        rating_min: query.rating_min,
        country: query.country || 'BR',
        free_shipping: query.free_shipping,
        limit: query.limit || 20,
        offset: ((query.page || 1) - 1) * (query.limit || 20),
      });

      // Processar resultados do ML
      for (const item of meliResults.results || []) {
        const listing = await this.processMeliItem(item);
        if (listing) {
          results.push(listing);
        }
      }

      // TODO: Integrar Shopee e Wish quando merchants estiverem conectados
      // const shopeeResults = await this.shopeeService.searchAuthorized(query);
      // const wishResults = await this.wishService.searchAuthorized(query);

      // Aplicar ranking
      const rankedResults = await this.rankingService.rankListings(results, {
        niche: query.niche,
        filters: query,
      });

      // Atualizar estatísticas de ranking
      await this.rankingService.updateRankingStats(rankedResults);

      const processingTime = Date.now() - startTime;

      this.logger.log(`Busca concluída em ${processingTime}ms, ${rankedResults.length} resultados`);

      return {
        listings: rankedResults,
        total: meliResults.paging?.total || rankedResults.length,
        filters_applied: query,
        processing_time: processingTime,
        marketplaces_searched: ['MLB'], // TODO: incluir Shopee/Wish quando disponível
        ranking_explanation: this.rankingService.getRankingExplanation(query.niche),
      };
    } catch (error) {
      this.logger.error(`Erro na busca por texto: ${error.message}`, error.stack);
      throw error;
    }
  }

  async searchByImage(file: Express.Multer.File, options: SearchImageDto) {
    this.logger.log(`Buscando por imagem: ${file.originalname}`);

    const startTime = Date.now();

    try {
      // 1. Busca por similaridade de imagem usando Alibaba Cloud Image Search
      const imageSearchResults = await this.alibabaImageService.searchByImage(file);
      
      // 2. Busca por imagem no Mercado Livre (fallback)
      const meliImageResults = await this.meliService.searchByImage(file.buffer.toString('base64'));

      // 2. Gerar embedding da imagem para busca local
      const imageEmbedding = await this.embeddingsService.generateImageEmbedding(file.buffer);

      // 3. Buscar produtos similares usando embeddings
      const similarProducts = await this.embeddingsService.searchByImageEmbedding(
        imageEmbedding,
        options.limit || 10,
      );

      // 4. Processar candidatos
      const candidates = [];
      for (const product of similarProducts) {
        const candidate = await this.processImageCandidate(product, imageEmbedding);
        if (candidate) {
          candidates.push(candidate);
        }
      }

      const processingTime = Date.now() - startTime;

      this.logger.log(`Busca por imagem concluída em ${processingTime}ms, ${candidates.length} candidatos`);

      return {
        candidates,
        processing_time: processingTime,
        model_used: 'CLIP + Alibaba Cloud Image Search + MELI',
        image_search_results: imageSearchResults,
        meli_image_results: meliImageResults,
      };
    } catch (error) {
      this.logger.error(`Erro na busca por imagem: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async processMeliItem(item: any) {
    try {
      // Normalizar dados do ML
      const listing = {
        id: `meli_${item.id}`,
        marketplace: 'MLB',
        external_item_id: item.id,
        title_raw: item.title,
        price_amount: item.price,
        price_currency: item.currency_id,
        url: item.permalink,
        thumbnail: item.thumbnail,
        seller: {
          id: item.seller.id,
          permalink: item.seller.permalink,
          registration_date: item.seller.registration_date,
          car_dealer: item.seller.car_dealer,
          real_estate_agency: item.seller.real_estate_agency,
          tags: item.seller.tags,
        },
        shipping: {
          free_shipping: item.shipping.free_shipping,
          mode: item.shipping.mode,
          tags: item.shipping.tags,
          logistic_type: item.shipping.logistic_type,
          store_pick_up: item.shipping.store_pick_up,
        },
        address: {
          state_id: item.address.state_id,
          state_name: item.address.state_name,
          city_id: item.address.city_id,
          city_name: item.address.city_name,
        },
        attributes: item.attributes || [],
        category_id: item.category_id,
        official_store_id: item.official_store_id,
        catalog_product_id: item.catalog_product_id,
        tags: item.tags,
        catalog_listing: item.catalog_listing,
        offer_score: item.offer_score,
        offer_share: item.offer_share,
        match_score: item.match_score,
        winner_item_id: item.winner_item_id,
        original_price: item.original_price,
        condition: item.condition,
      };

      // Calcular score básico
      const score = await this.rankingService.calculateBasicScore(listing);

      return {
        ...listing,
        score,
        explanation: {
          demanda: score.demanda,
          qualidade: score.qualidade,
          preco: score.preco,
          logistica: score.logistica,
          reputacao: score.reputacao,
          penalty: score.penalty,
        },
      };
    } catch (error) {
      this.logger.warn(`Erro ao processar item ML ${item.id}: ${error.message}`);
      return null;
    }
  }

  private async processImageCandidate(product: any, imageEmbedding: number[]) {
    try {
      // Buscar listagens do produto
      const listings = await this.getProductListings(product.id);

      // Calcular similaridade de imagem
      const imageSimilarity = await this.embeddingsService.calculateImageSimilarity(
        imageEmbedding,
        product.image_embedding,
      );

      // Calcular similaridade de texto
      const textSimilarity = await this.embeddingsService.calculateTextSimilarity(
        product.title,
        product.title, // TODO: usar título da imagem se disponível
      );

      // Determinar matching
      const explanation = {
        gtin_match: product.gtin ? true : false,
        brand_match: product.brand ? true : false,
        title_similarity: textSimilarity,
        image_similarity: imageSimilarity,
      };

      return {
        product_id: product.id,
        title: product.title,
        image_url: product.image_primary_url,
        score: Math.max(imageSimilarity, textSimilarity),
        listings,
        explanation,
      };
    } catch (error) {
      this.logger.warn(`Erro ao processar candidato ${product.id}: ${error.message}`);
      return null;
    }
  }

  private async getProductListings(productId: string) {
    // TODO: Implementar busca de listagens do produto
    // Por enquanto, retornar array vazio
    return [];
  }
}
