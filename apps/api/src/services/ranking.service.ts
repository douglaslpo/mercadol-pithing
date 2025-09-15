import { Injectable, Logger } from '@nestjs/common';
import { RankingFeatures, ScoreExplanation } from '@packages/shared';
import { RedisService } from '../modules/redis/redis.service';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Calcular score básico para uma listagem
   */
  async calculateBasicScore(listing: any): Promise<ScoreExplanation> {
    try {
      const features: RankingFeatures = {
        demanda: this.calculateDemandScore(listing),
        qualidade: this.calculateQualityScore(listing),
        preco: this.calculatePriceScore(listing),
        logistica: this.calculateLogisticsScore(listing),
        reputacao: this.calculateReputationScore(listing),
        penalty: this.calculatePenaltyScore(listing),
      };

      return {
        demanda: features.demanda || 0,
        qualidade: features.qualidade || 0,
        preco: features.preco || 0,
        logistica: features.logistica || 0,
        reputacao: features.reputacao || 0,
        penalty: features.penalty || 0,
      };
    } catch (error) {
      this.logger.error(`Erro ao calcular score básico: ${error.message}`);
      return {
        demanda: 0,
        qualidade: 0,
        preco: 0,
        logistica: 0,
        reputacao: 0,
        penalty: 0,
      };
    }
  }

  /**
   * Ranquear listagens com base em critérios
   */
  async rankListings(listings: any[], options: any = {}): Promise<any[]> {
    try {
      this.logger.log(`Ranqueando ${listings.length} listagens`);

      // Calcular scores para todas as listagens
      const rankedListings = await Promise.all(
        listings.map(async (listing) => {
          const score = await this.calculateBasicScore(listing);
          const finalScore = this.calculateFinalScore(score, options.niche);
          
          return {
            ...listing,
            score: finalScore,
            explanation: score,
          };
        })
      );

      // Ordenar por score decrescente
      return rankedListings.sort((a, b) => b.score - a.score);
    } catch (error) {
      this.logger.error(`Erro no ranqueamento: ${error.message}`);
      return listings;
    }
  }

  /**
   * Calcular score de demanda
   */
  private calculateDemandScore(listing: any): number {
    // Usar reviews como proxy de demanda
    const reviewCount = listing.rating_count || 0;
    const stock = listing.stock || 0;
    
    // Normalizar baseado em percentis (simulado)
    if (reviewCount >= 100) return 1.0;
    if (reviewCount >= 50) return 0.8;
    if (reviewCount >= 20) return 0.6;
    if (reviewCount >= 10) return 0.4;
    if (reviewCount >= 5) return 0.2;
    return 0.1;
  }

  /**
   * Calcular score de qualidade
   */
  private calculateQualityScore(listing: any): number {
    const rating = listing.rating_avg || 0;
    const reviewCount = listing.rating_count || 0;
    
    // Penalizar produtos com poucas reviews
    const reviewPenalty = Math.min(reviewCount / 10, 1);
    
    // Normalizar rating (0-5 para 0-1)
    const normalizedRating = rating / 5;
    
    return normalizedRating * reviewPenalty;
  }

  /**
   * Calcular score de preço (menor é melhor)
   */
  private calculatePriceScore(listing: any): number {
    const price = listing.price_amount || 0;
    
    // TODO: Implementar comparação com mediana do nicho
    // Por enquanto, usar heurística simples
    if (price <= 50) return 1.0;
    if (price <= 100) return 0.8;
    if (price <= 200) return 0.6;
    if (price <= 500) return 0.4;
    if (price <= 1000) return 0.2;
    return 0.1;
  }

  /**
   * Calcular score de logística
   */
  private calculateLogisticsScore(listing: any): number {
    const shipping = listing.shipping || {};
    
    let score = 0.5; // Base
    
    // Frete grátis
    if (shipping.free_shipping) {
      score += 0.3;
    }
    
    // Modo de envio
    if (shipping.mode === 'me2') {
      score += 0.2; // Mercado Envios
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calcular score de reputação do vendedor
   */
  private calculateReputationScore(listing: any): number {
    const seller = listing.seller || {};
    const reputation = seller.reputation || {};
    
    // Mercado Livre reputation levels
    const levelId = reputation.level_id;
    const powerSellerStatus = reputation.power_seller_status;
    
    let score = 0.5; // Base
    
    // Power seller
    if (powerSellerStatus === 'gold') score += 0.3;
    else if (powerSellerStatus === 'silver') score += 0.2;
    else if (powerSellerStatus === 'bronze') score += 0.1;
    
    // Level (quanto maior, melhor)
    if (levelId === '5_green') score += 0.2;
    else if (levelId === '4_light_green') score += 0.15;
    else if (levelId === '3_yellow') score += 0.1;
    else if (levelId === '2_orange') score += 0.05;
    
    return Math.min(score, 1.0);
  }

  /**
   * Calcular penalidades
   */
  private calculatePenaltyScore(listing: any): number {
    let penalty = 0;
    
    // Produto sem estoque
    if (listing.stock === 0) {
      penalty += 0.5;
    }
    
    // Preço muito alto (heurística)
    if (listing.price_amount > 2000) {
      penalty += 0.2;
    }
    
    // Poucas reviews
    if ((listing.rating_count || 0) < 3) {
      penalty += 0.1;
    }
    
    return Math.min(penalty, 1.0);
  }

  /**
   * Calcular score final com pesos por nicho
   */
  private calculateFinalScore(explanation: ScoreExplanation, niche?: string): number {
    // Pesos padrão
    let weights = {
      demanda: 0.3,
      qualidade: 0.25,
      preco: 0.2,
      logistica: 0.15,
      reputacao: 0.1,
    };

    // Ajustar pesos por nicho
    if (niche) {
      switch (niche.toLowerCase()) {
        case 'eletroportateis':
        case 'eletrônicos':
          weights.qualidade = 0.35;
          weights.reputacao = 0.2;
          weights.preco = 0.15;
          break;
        case 'moda':
        case 'roupas':
          weights.qualidade = 0.3;
          weights.preco = 0.25;
          weights.demanda = 0.25;
          break;
        case 'casa':
        case 'decoração':
          weights.preco = 0.3;
          weights.logistica = 0.2;
          weights.demanda = 0.2;
          break;
        case 'esportes':
        case 'fitness':
          weights.qualidade = 0.3;
          weights.reputacao = 0.2;
          weights.demanda = 0.25;
          break;
      }
    }

    // Calcular score final
    const score = 
      weights.demanda * explanation.demanda +
      weights.qualidade * explanation.qualidade +
      weights.preco * explanation.preco +
      weights.logistica * explanation.logistica +
      weights.reputacao * explanation.reputacao -
      explanation.penalty * 0.2; // Penalty tem peso fixo

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Obter explicação do ranking para um nicho
   */
  getRankingExplanation(niche?: string): string {
    if (!niche) {
      return 'Ranking baseado em demanda (30%), qualidade (25%), preço (20%), logística (15%) e reputação (10%)';
    }

    switch (niche.toLowerCase()) {
      case 'eletroportateis':
      case 'eletrônicos':
        return 'Ranking otimizado para eletrônicos: qualidade (35%), reputação (20%), demanda (25%), preço (15%) e logística (5%)';
      case 'moda':
      case 'roupas':
        return 'Ranking otimizado para moda: qualidade (30%), preço (25%), demanda (25%), logística (10%) e reputação (10%)';
      case 'casa':
      case 'decoração':
        return 'Ranking otimizado para casa: preço (30%), logística (20%), demanda (20%), qualidade (15%) e reputação (15%)';
      case 'esportes':
      case 'fitness':
        return 'Ranking otimizado para esportes: qualidade (30%), reputação (20%), demanda (25%), preço (15%) e logística (10%)';
      default:
        return 'Ranking padrão: demanda (30%), qualidade (25%), preço (20%), logística (15%) e reputação (10%)';
    }
  }

  /**
   * Obter estatísticas de ranking
   */
  async getRankingStats(): Promise<any> {
    try {
      const stats = {
        total_listings_ranked: await this.redisService.get('ranking:total_listings') || '0',
        average_score: await this.redisService.get('ranking:average_score') || '0',
        top_categories: await this.redisService.get('ranking:top_categories') || '[]',
        last_updated: await this.redisService.get('ranking:last_updated') || new Date().toISOString(),
      };

      return stats;
    } catch (error) {
      this.logger.error('Error getting ranking stats:', error);
      return {};
    }
  }

  /**
   * Atualizar estatísticas de ranking
   */
  async updateRankingStats(listings: any[]): Promise<void> {
    try {
      const totalListings = listings.length;
      const averageScore = listings.reduce((sum, listing) => sum + (listing.score || 0), 0) / totalListings;
      
      const categoryCounts = {};
      listings.forEach(listing => {
        if (listing.category_id) {
          categoryCounts[listing.category_id] = (categoryCounts[listing.category_id] || 0) + 1;
        }
      });
      
      const topCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([category, count]) => ({ category, count }));

      await this.redisService.setex('ranking:total_listings', 3600, totalListings.toString());
      await this.redisService.setex('ranking:average_score', 3600, averageScore.toString());
      await this.redisService.setex('ranking:top_categories', 3600, JSON.stringify(topCategories));
      await this.redisService.setex('ranking:last_updated', 3600, new Date().toISOString());
    } catch (error) {
      this.logger.error('Error updating ranking stats:', error);
    }
  }

  /**
   * Obter popularidade da categoria
   */
  private async getCategoryPopularity(categoryId: string): Promise<number> {
    try {
      const cacheKey = `category_popularity:${categoryId}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return parseFloat(cached);
      }

      // Simular popularidade baseada no ID da categoria
      // Em produção, isso viria de dados reais
      const popularity = Math.random() * 0.8 + 0.2; // 0.2 a 1.0
      
      await this.redisService.setex(cacheKey, 3600, popularity.toString());
      
      return popularity;
    } catch (error) {
      this.logger.error('Error getting category popularity:', error);
      return 0.5;
    }
  }

  /**
   * Obter preço médio da categoria
   */
  private async getCategoryAveragePrice(categoryId: string): Promise<number | null> {
    try {
      const cacheKey = `category_avg_price:${categoryId}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return parseFloat(cached);
      }

      // Simular preço médio baseado no ID da categoria
      // Em produção, isso viria de dados reais
      const avgPrice = Math.random() * 500 + 50; // R$ 50 a R$ 550
      
      await this.redisService.setex(cacheKey, 3600, avgPrice.toString());
      
      return avgPrice;
    } catch (error) {
      this.logger.error('Error getting category average price:', error);
      return null;
    }
  }

  /**
   * Aplicar ajustes contextuais ao score
   */
  private async applyContextualAdjustments(
    score: ScoreExplanation,
    listing: any,
    options: any
  ): Promise<ScoreExplanation> {
    let adjustedScore = { ...score };

    // Ajuste por nicho
    if (options.niche) {
      adjustedScore = await this.adjustForNiche(adjustedScore, listing, options.niche);
    }

    // Ajuste por preferências do usuário
    if (options.user_preferences) {
      adjustedScore = await this.adjustForUserPreferences(adjustedScore, listing, options.user_preferences);
    }

    // Ajuste por marketplace
    if (options.marketplaces) {
      adjustedScore = await this.adjustForMarketplace(adjustedScore, listing, options.marketplaces);
    }

    return adjustedScore;
  }

  /**
   * Ajustar score para nicho específico
   */
  private async adjustForNiche(score: ScoreExplanation, listing: any, niche: string): Promise<ScoreExplanation> {
    // Implementar ajustes específicos por nicho
    // Por exemplo, eletrônicos podem ter peso maior em qualidade
    // Roupas podem ter peso maior em preço
    
    const nicheWeights = {
      'electronics': { qualidade: 0.4, preco: 0.15 },
      'clothing': { preco: 0.3, qualidade: 0.2 },
      'home': { logistica: 0.25, qualidade: 0.2 },
      'sports': { qualidade: 0.35, preco: 0.15 },
    };

    const weights = nicheWeights[niche] || {};
    
    if (weights.qualidade) {
      score.qualidade *= 1.2;
    }
    if (weights.preco) {
      score.preco *= 1.2;
    }
    if (weights.logistica) {
      score.logistica *= 1.2;
    }

    return score;
  }

  /**
   * Ajustar score para preferências do usuário
   */
  private async adjustForUserPreferences(score: ScoreExplanation, listing: any, preferences: any): Promise<ScoreExplanation> {
    // Implementar ajustes baseados nas preferências do usuário
    // Por exemplo, usuário que prefere frete grátis
    
    if (preferences.free_shipping && listing.shipping?.free_shipping) {
      score.logistica *= 1.3;
    }

    if (preferences.official_stores && listing.official_store_id) {
      score.qualidade *= 1.2;
    }

    return score;
  }

  /**
   * Ajustar score para marketplace específico
   */
  private async adjustForMarketplace(score: ScoreExplanation, listing: any, marketplaces: string[]): Promise<ScoreExplanation> {
    // Implementar ajustes baseados no marketplace
    // Por exemplo, dar preferência para marketplaces específicos
    
    if (marketplaces.includes(listing.marketplace)) {
      // Aplicar boost geral
      score.demanda *= 1.1;
      score.qualidade *= 1.1;
      score.preco *= 1.1;
      score.logistica *= 1.1;
      score.reputacao *= 1.1;
    }

    return score;
  }
}
