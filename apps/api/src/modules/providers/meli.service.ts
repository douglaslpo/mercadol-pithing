import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { RedisService } from '../../redis/redis.service';

export interface MeliTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
  scope: string;
}

export interface MeliSearchParams {
  q?: string;
  category?: string;
  seller_id?: string;
  price?: string;
  condition?: 'new' | 'used' | 'not_specified';
  sort?: 'price_asc' | 'price_desc' | 'relevance';
  limit?: number;
  offset?: number;
  state?: string;
  city?: string;
  price_min?: number;
  price_max?: number;
  rating_min?: number;
  country?: string;
  free_shipping?: boolean;
}

export interface MeliSearchResult {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  condition: string;
  thumbnail: string;
  permalink: string;
  seller: {
    id: number;
    permalink: string;
    registration_date: string;
    car_dealer: boolean;
    real_estate_agency: boolean;
    tags: string[];
  };
  shipping: {
    free_shipping: boolean;
    mode: string;
    tags: string[];
    logistic_type: string;
    store_pick_up: boolean;
  };
  address: {
    state_id: string;
    state_name: string;
    city_id: string;
    city_name: string;
  };
  attributes: Array<{
    id: string;
    name: string;
    value_id: string;
    value_name: string;
    value_struct: any;
    values: Array<{
      id: string;
      name: string;
      struct: any;
    }>;
    attribute_group_id: string;
    attribute_group_name: string;
  }>;
  original_price?: number;
  category_id: string;
  official_store_id?: number;
  catalog_product_id?: string;
  tags: string[];
  catalog_listing?: boolean;
  use_thumbnail_id?: boolean;
  offer_score?: number;
  offer_share?: number;
  match_score?: number;
  winner_item_id?: string;
  melicoin?: any;
  discounts?: any;
  order_backend?: number;
}

export interface MeliSearchResponse {
  site_id: string;
  country_default_time_zone: string;
  query: string;
  paging: {
    total: number;
    primary_results: number;
    offset: number;
    limit: number;
  };
  results: MeliSearchResult[];
  secondary_results: any[];
  related_results: any[];
  sort: {
    id: string;
    name: string;
  };
  available_sorts: Array<{
    id: string;
    name: string;
  }>;
  filters: any[];
  available_filters: any[];
}

export interface MeliItemResponse {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  condition: string;
  thumbnail: string;
  permalink: string;
  pictures: Array<{
    id: string;
    url: string;
    secure_url: string;
    size: string;
    max_size: string;
    quality: string;
  }>;
  descriptions: Array<{
    id: string;
    text: string;
    plain_text: string;
    last_updated: string;
    date_created: string;
  }>;
  seller: {
    id: number;
    permalink: string;
    registration_date: string;
    car_dealer: boolean;
    real_estate_agency: boolean;
    tags: string[];
  };
  shipping: {
    free_shipping: boolean;
    mode: string;
    tags: string[];
    logistic_type: string;
    store_pick_up: boolean;
  };
  address: {
    state_id: string;
    state_name: string;
    city_id: string;
    city_name: string;
  };
  attributes: Array<{
    id: string;
    name: string;
    value_id: string;
    value_name: string;
    value_struct: any;
    values: Array<{
      id: string;
      name: string;
      struct: any;
    }>;
    attribute_group_id: string;
    attribute_group_name: string;
  }>;
  original_price?: number;
  category_id: string;
  official_store_id?: number;
  catalog_product_id?: string;
  tags: string[];
  catalog_listing?: boolean;
  use_thumbnail_id?: boolean;
  offer_score?: number;
  offer_share?: number;
  match_score?: number;
  winner_item_id?: string;
  melicoin?: any;
  discounts?: any;
  order_backend?: number;
}

export interface MeliSellerResponse {
  id: number;
  permalink: string;
  registration_date: string;
  car_dealer: boolean;
  real_estate_agency: boolean;
  tags: string[];
  seller_reputation: {
    level_id: string;
    power_seller_status: string;
    transactions: {
      period: string;
      total: number;
      completed: number;
      canceled: number;
      ratings: {
        period: string;
        average: number;
        total: number;
      };
    };
    metrics: {
      sales: {
        period: string;
        completed: number;
      };
      claims: {
        period: string;
        rate: number;
        value: number;
      };
      delayed_handling_time: {
        period: string;
        rate: number;
        value: number;
      };
      cancellations: {
        period: string;
        rate: number;
        value: number;
      };
    };
  };
}

@Injectable()
export class MeliService {
  private readonly logger = new Logger(MeliService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl = 'https://api.mercadolibre.com';
  private readonly siteId = 'MLB'; // Brasil

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoL-Pithing/1.0.0',
      },
    });

    // Interceptor para rate limiting
    this.httpClient.interceptors.request.use(async (config) => {
      const key = `meli:rate_limit:${config.url}`;
      const requests = await this.redisService.get(key);
      if (requests && parseInt(requests) >= 1000) {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      return config;
    });

    // Interceptor para logging
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.log(`MELI API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error(`MELI API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.message}`);
        if (error.response?.status === 429) {
          this.logger.warn('Rate limit atingido, aguardando...');
          return this.delay(1000).then(() => this.httpClient.request(error.config));
        }
        throw error;
      }
    );
  }

  /**
   * Busca pública no Mercado Livre com cache
   */
  async searchPublic(params: MeliSearchParams): Promise<MeliSearchResponse> {
    try {
      const cacheKey = `meli:search:${JSON.stringify(params)}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        this.logger.log(`Cache hit for search: ${params.q}`);
        return JSON.parse(cached);
      }

      this.logger.log(`Buscando no ML: "${params.q}"`);

      const url = `${this.baseUrl}/sites/${this.siteId}/search`;
      const response = await this.httpClient.get(url, { params });

      const searchData: MeliSearchResponse = response.data;
      
      // Cache for 5 minutes
      await this.redisService.setex(cacheKey, 300, JSON.stringify(searchData));

      return searchData;
    } catch (error) {
      this.logger.error('Error in public search:', error);
      throw new HttpException('Failed to search products', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obter detalhes de um item específico com cache
   */
  async getItem(itemId: string): Promise<MeliItemResponse> {
    try {
      const cacheKey = `meli:item:${itemId}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const url = `${this.baseUrl}/items/${itemId}`;
      const response = await this.httpClient.get(url);

      const itemData: MeliItemResponse = response.data;
      
      // Cache for 1 hour
      await this.redisService.setex(cacheKey, 3600, JSON.stringify(itemData));

      return itemData;
    } catch (error) {
      this.logger.error(`Error getting item ${itemId}:`, error);
      throw new HttpException('Failed to get item details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obter informações do vendedor com cache
   */
  async getSeller(sellerId: number): Promise<MeliSellerResponse> {
    try {
      const cacheKey = `meli:seller:${sellerId}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const url = `${this.baseUrl}/users/${sellerId}`;
      const response = await this.httpClient.get(url);

      const sellerData: MeliSellerResponse = response.data;
      
      // Cache for 1 hour
      await this.redisService.setex(cacheKey, 3600, JSON.stringify(sellerData));

      return sellerData;
    } catch (error) {
      this.logger.error(`Error getting seller ${sellerId}:`, error);
      throw new HttpException('Failed to get seller details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obter produtos de um vendedor específico
   */
  async getSellerItems(sellerId: number, params: MeliSearchParams = {}): Promise<MeliSearchResponse> {
    try {
      const cacheKey = `meli:seller_items:${sellerId}:${JSON.stringify(params)}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const url = `${this.baseUrl}/sites/${this.siteId}/search`;
      const searchParams = { ...params, seller_id: sellerId.toString() };
      const response = await this.httpClient.get(url, { params: searchParams });

      const searchData: MeliSearchResponse = response.data;
      
      // Cache for 10 minutes
      await this.redisService.setex(cacheKey, 600, JSON.stringify(searchData));

      return searchData;
    } catch (error) {
      this.logger.error(`Error getting seller ${sellerId} items:`, error);
      throw new HttpException('Failed to get seller items', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obter categorias disponíveis com cache
   */
  async getCategories(): Promise<any[]> {
    try {
      const cacheKey = 'meli:categories';
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const url = `${this.baseUrl}/sites/${this.siteId}/categories`;
      const response = await this.httpClient.get(url);

      const categories = response.data;
      
      // Cache for 24 hours
      await this.redisService.setex(cacheKey, 86400, JSON.stringify(categories));

      return categories;
    } catch (error) {
      this.logger.error('Error getting categories:', error);
      throw new HttpException('Failed to get categories', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obter detalhes de uma categoria específica
   */
  async getCategory(categoryId: string): Promise<any> {
    try {
      const cacheKey = `meli:category:${categoryId}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const url = `${this.baseUrl}/categories/${categoryId}`;
      const response = await this.httpClient.get(url);

      const category = response.data;
      
      // Cache for 24 hours
      await this.redisService.setex(cacheKey, 86400, JSON.stringify(category));

      return category;
    } catch (error) {
      this.logger.error(`Error getting category ${categoryId}:`, error);
      throw new HttpException('Failed to get category details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * OAuth: Trocar código por token com cache
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<MeliTokenResponse> {
    try {
      const clientId = this.configService.get<string>('MELI_CLIENT_ID');
      const clientSecret = this.configService.get<string>('MELI_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        throw new HttpException('MELI credentials not configured', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const url = `${this.baseUrl}/oauth/token`;
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      });

      const response = await this.httpClient.post(url, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const tokenData: MeliTokenResponse = response.data;
      
      // Cache token data
      await this.redisService.setex(
        `meli:token:${tokenData.user_id}`,
        3600, // 1 hour
        JSON.stringify(tokenData)
      );

      return tokenData;
    } catch (error) {
      this.logger.error('Error exchanging code for token:', error);
      throw new HttpException('Failed to exchange code for token', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<MeliTokenResponse> {
    try {
      const clientId = this.configService.get<string>('MELI_CLIENT_ID');
      const clientSecret = this.configService.get<string>('MELI_CLIENT_SECRET');

      const url = `${this.baseUrl}/oauth/token`;
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      });

      const response = await this.httpClient.post(url, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error refreshing token:', error);
      throw new HttpException('Failed to refresh token', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Obter URL de autorização OAuth
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const clientId = this.configService.get<string>('MELI_CLIENT_ID');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.baseUrl}/authorization?${params.toString()}`;
  }

  /**
   * Busca por imagem (usando Alibaba Cloud Image Search como fallback)
   */
  async searchByImage(imageBase64: string): Promise<MeliSearchResponse> {
    try {
      // This would integrate with Alibaba Cloud Image Search
      // For now, return empty results
      this.logger.warn('Image search not fully implemented yet');
      
      return {
        site_id: this.siteId,
        country_default_time_zone: 'GMT-03:00',
        query: 'image_search',
        paging: { total: 0, primary_results: 0, offset: 0, limit: 50 },
        results: [],
        secondary_results: [],
        related_results: [],
        sort: { id: 'relevance', name: 'Relevância' },
        available_sorts: [],
        filters: [],
        available_filters: [],
      };
    } catch (error) {
      this.logger.error('Error in image search:', error);
      throw new HttpException('Failed to search by image', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obter buscas em tendência
   */
  async getTrendingSearches(): Promise<string[]> {
    try {
      const cacheKey = 'meli:trending_searches';
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const url = `${this.baseUrl}/sites/${this.siteId}/trends/search`;
      const response = await this.httpClient.get(url);

      const trends = response.data;
      
      // Cache for 1 hour
      await this.redisService.setex(cacheKey, 3600, JSON.stringify(trends));

      return trends;
    } catch (error) {
      this.logger.error('Error getting trending searches:', error);
      throw new HttpException('Failed to get trending searches', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Health check para API do MELI
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/sites/${this.siteId}`;
      const response = await this.httpClient.get(url);
      return response.status === 200;
    } catch (error) {
      this.logger.error('MELI API health check failed:', error);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
