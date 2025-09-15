import { Controller, Get, Post, Query, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MeliService } from './meli.service';
import { AlibabaImageService } from './alibaba-image.service';
import { ShopeeService } from './shopee.service';
import { WishService } from './wish.service';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  private readonly logger = new Logger(ProvidersController.name);

  constructor(
    private readonly meliService: MeliService,
    private readonly alibabaImageService: AlibabaImageService,
    private readonly shopeeService: ShopeeService,
    private readonly wishService: WishService,
  ) {}

  // ===========================================
  // MERCADO LIVRE ENDPOINTS
  // ===========================================

  @Get('meli/search')
  @ApiOperation({ summary: 'Busca pública no Mercado Livre' })
  @ApiQuery({ name: 'q', description: 'Termo de busca', required: true })
  @ApiQuery({ name: 'limit', description: 'Número de resultados', required: false })
  @ApiQuery({ name: 'category', description: 'Categoria', required: false })
  @ApiQuery({ name: 'price_min', description: 'Preço mínimo', required: false })
  @ApiQuery({ name: 'price_max', description: 'Preço máximo', required: false })
  @ApiResponse({
    status: 200,
    description: 'Resultados da busca no Mercado Livre',
  })
  async searchMeli(@Query() query: any) {
    this.logger.log(`Busca MELI: ${query.q}`);
    return this.meliService.searchPublic(query);
  }

  @Get('meli/item/:id')
  @ApiOperation({ summary: 'Detalhes de um item do Mercado Livre' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do item',
  })
  async getMeliItem(@Param('id') id: string) {
    this.logger.log(`Buscando item MELI: ${id}`);
    return this.meliService.getItemDetails(id);
  }

  @Get('meli/seller/:id')
  @ApiOperation({ summary: 'Informações de um vendedor do Mercado Livre' })
  @ApiResponse({
    status: 200,
    description: 'Informações do vendedor',
  })
  async getMeliSeller(@Param('id') id: string) {
    this.logger.log(`Buscando vendedor MELI: ${id}`);
    return this.meliService.getSellerInfo(id);
  }

  @Get('meli/seller/:id/items')
  @ApiOperation({ summary: 'Itens de um vendedor do Mercado Livre' })
  @ApiQuery({ name: 'limit', description: 'Número de itens', required: false })
  @ApiResponse({
    status: 200,
    description: 'Lista de itens do vendedor',
  })
  async getMeliSellerItems(@Param('id') id: string, @Query('limit') limit?: number) {
    this.logger.log(`Buscando itens do vendedor MELI: ${id}`);
    return this.meliService.getSellerItems(id, limit || 20);
  }

  @Get('meli/category/:id')
  @ApiOperation({ summary: 'Informações de uma categoria do Mercado Livre' })
  @ApiResponse({
    status: 200,
    description: 'Informações da categoria',
  })
  async getMeliCategory(@Param('id') id: string) {
    this.logger.log(`Buscando categoria MELI: ${id}`);
    return this.meliService.getCategory(id);
  }

  @Get('meli/trending')
  @ApiOperation({ summary: 'Termos de busca em alta no Mercado Livre' })
  @ApiResponse({
    status: 200,
    description: 'Lista de termos em alta',
  })
  async getMeliTrending() {
    this.logger.log('Buscando termos em alta no MELI');
    return this.meliService.getTrendingSearches();
  }

  @Get('meli/health')
  @ApiOperation({ summary: 'Health check da API do Mercado Livre' })
  @ApiResponse({
    status: 200,
    description: 'Status da API do Mercado Livre',
  })
  async getMeliHealth() {
    this.logger.log('Verificando saúde da API MELI');
    return {
      status: await this.meliService.healthCheck() ? 'healthy' : 'unhealthy',
      service: 'Mercado Livre API',
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================
  // ALIBABA IMAGE SEARCH ENDPOINTS
  // ===========================================

  @Get('alibaba/categories')
  @ApiOperation({ summary: 'Categorias disponíveis no Alibaba Image Search' })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorias',
  })
  async getAlibabaCategories() {
    this.logger.log('Buscando categorias Alibaba');
    return this.alibabaImageService.getCategories();
  }

  @Get('alibaba/health')
  @ApiOperation({ summary: 'Health check da API do Alibaba Image Search' })
  @ApiResponse({
    status: 200,
    description: 'Status da API do Alibaba Image Search',
  })
  async getAlibabaHealth() {
    this.logger.log('Verificando saúde da API Alibaba');
    return {
      status: await this.alibabaImageService.healthCheck() ? 'healthy' : 'unhealthy',
      service: 'Alibaba Image Search API',
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================
  // SHOPEE ENDPOINTS
  // ===========================================

  @Get('shopee/auth-url')
  @ApiOperation({ summary: 'URL de autorização para Shopee' })
  @ApiQuery({ name: 'redirectUrl', description: 'URL de redirecionamento', required: true })
  @ApiResponse({
    status: 200,
    description: 'URL de autorização',
  })
  async getShopeeAuthUrl(@Query('redirectUrl') redirectUrl: string) {
    this.logger.log('Gerando URL de autorização Shopee');
    return {
      auth_url: this.shopeeService.getAuthorizationUrl(redirectUrl),
      service: 'Shopee',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('shopee/health')
  @ApiOperation({ summary: 'Health check da API da Shopee' })
  @ApiResponse({
    status: 200,
    description: 'Status da API da Shopee',
  })
  async getShopeeHealth() {
    this.logger.log('Verificando saúde da API Shopee');
    return {
      status: await this.shopeeService.healthCheck() ? 'healthy' : 'unhealthy',
      service: 'Shopee API',
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================
  // WISH ENDPOINTS
  // ===========================================

  @Get('wish/auth-url')
  @ApiOperation({ summary: 'URL de autorização para Wish' })
  @ApiQuery({ name: 'redirectUri', description: 'URI de redirecionamento', required: true })
  @ApiResponse({
    status: 200,
    description: 'URL de autorização',
  })
  async getWishAuthUrl(@Query('redirectUri') redirectUri: string) {
    this.logger.log('Gerando URL de autorização Wish');
    return {
      auth_url: this.wishService.getAuthorizationUrl(redirectUri),
      service: 'Wish',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('wish/health')
  @ApiOperation({ summary: 'Health check da API da Wish' })
  @ApiResponse({
    status: 200,
    description: 'Status da API da Wish',
  })
  async getWishHealth() {
    this.logger.log('Verificando saúde da API Wish');
    return {
      status: await this.wishService.healthCheck() ? 'healthy' : 'unhealthy',
      service: 'Wish API',
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================
  // HEALTH CHECK GERAL
  // ===========================================

  @Get('health')
  @ApiOperation({ summary: 'Health check de todos os providers' })
  @ApiResponse({
    status: 200,
    description: 'Status de todos os providers',
  })
  async getAllProvidersHealth() {
    this.logger.log('Verificando saúde de todos os providers');
    
    const [meli, alibaba, shopee, wish] = await Promise.allSettled([
      this.meliService.healthCheck(),
      this.alibabaImageService.healthCheck(),
      this.shopeeService.healthCheck(),
      this.wishService.healthCheck(),
    ]);

    return {
      providers: {
        meli: {
          status: meli.status === 'fulfilled' && meli.value ? 'healthy' : 'unhealthy',
          service: 'Mercado Livre',
        },
        alibaba: {
          status: alibaba.status === 'fulfilled' && alibaba.value ? 'healthy' : 'unhealthy',
          service: 'Alibaba Image Search',
        },
        shopee: {
          status: shopee.status === 'fulfilled' && shopee.value ? 'healthy' : 'unhealthy',
          service: 'Shopee',
        },
        wish: {
          status: wish.status === 'fulfilled' && wish.value ? 'healthy' : 'unhealthy',
          service: 'Wish',
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
