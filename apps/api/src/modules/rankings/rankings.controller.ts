import { Controller, Get, Query, Logger } from '@nestjs/common';
import { RankingService } from '../../services/ranking.service';

@Controller('rankings')
export class RankingsController {
  private readonly logger = new Logger(RankingsController.name);

  constructor(private readonly rankingService: RankingService) {}

  /**
   * Obter estatísticas de ranking
   */
  @Get('stats')
  async getRankingStats() {
    try {
      this.logger.log('Getting ranking statistics');
      
      const stats = await this.rankingService.getRankingStats();
      
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting ranking stats:', error);
      return {
        success: false,
        error: 'Failed to get ranking statistics',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Obter explicação do ranking para um nicho
   */
  @Get('explanation')
  async getRankingExplanation(@Query('niche') niche?: string) {
    try {
      this.logger.log(`Getting ranking explanation for niche: ${niche || 'default'}`);
      
      const explanation = this.rankingService.getRankingExplanation(niche);
      
      return {
        success: true,
        data: {
          niche: niche || 'default',
          explanation,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting ranking explanation:', error);
      return {
        success: false,
        error: 'Failed to get ranking explanation',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Obter pesos de ranking para diferentes nichos
   */
  @Get('weights')
  async getRankingWeights(@Query('niche') niche?: string) {
    try {
      this.logger.log(`Getting ranking weights for niche: ${niche || 'default'}`);
      
      const weights = this.getWeightsForNiche(niche);
      
      return {
        success: true,
        data: {
          niche: niche || 'default',
          weights,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting ranking weights:', error);
      return {
        success: false,
        error: 'Failed to get ranking weights',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Obter histórico de scores para uma categoria
   */
  @Get('history')
  async getRankingHistory(@Query('category') category?: string) {
    try {
      this.logger.log(`Getting ranking history for category: ${category || 'all'}`);
      
      // Simular histórico de scores
      const history = this.generateMockHistory(category);
      
      return {
        success: true,
        data: {
          category: category || 'all',
          history,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting ranking history:', error);
      return {
        success: false,
        error: 'Failed to get ranking history',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Obter pesos para um nicho específico
   */
  private getWeightsForNiche(niche?: string): any {
    const defaultWeights = {
      demanda: 0.3,
      qualidade: 0.25,
      preco: 0.2,
      logistica: 0.15,
      reputacao: 0.1,
    };

    if (!niche) {
      return defaultWeights;
    }

    switch (niche.toLowerCase()) {
      case 'eletroportateis':
      case 'eletrônicos':
        return {
          demanda: 0.25,
          qualidade: 0.35,
          preco: 0.15,
          logistica: 0.05,
          reputacao: 0.2,
        };
      case 'moda':
      case 'roupas':
        return {
          demanda: 0.25,
          qualidade: 0.3,
          preco: 0.25,
          logistica: 0.1,
          reputacao: 0.1,
        };
      case 'casa':
      case 'decoração':
        return {
          demanda: 0.2,
          qualidade: 0.15,
          preco: 0.3,
          logistica: 0.2,
          reputacao: 0.15,
        };
      case 'esportes':
      case 'fitness':
        return {
          demanda: 0.25,
          qualidade: 0.3,
          preco: 0.15,
          logistica: 0.1,
          reputacao: 0.2,
        };
      default:
        return defaultWeights;
    }
  }

  /**
   * Gerar histórico simulado
   */
  private generateMockHistory(category?: string): any[] {
    const history = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      history.push({
        date: date.toISOString().split('T')[0],
        average_score: Math.random() * 0.3 + 0.6, // 0.6 a 0.9
        total_listings: Math.floor(Math.random() * 1000) + 100,
        top_categories: [
          { category: 'MLB1430', count: Math.floor(Math.random() * 100) + 50 },
          { category: 'MLB1055', count: Math.floor(Math.random() * 80) + 30 },
          { category: 'MLB1000', count: Math.floor(Math.random() * 60) + 20 },
        ],
      });
    }
    
    return history;
  }
}
