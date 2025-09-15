import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { RedisService } from '../redis/redis.service';

export interface WishTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  merchant_id: string;
  scope: string;
}

export interface WishSearchParams {
  query?: string;
  category?: string;
  price_min?: number;
  price_max?: number;
  sort_by?: 'relevance' | 'price' | 'rating' | 'newest';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  merchant_id?: string;
}

export interface WishSearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  original_price?: number;
  discount_percentage?: number;
  stock: number;
  condition: string;
  status: string;
  created_time: number;
  updated_time: number;
  images: string[];
  rating: {
    average: number;
    count: number;
  };
  merchant: {
    id: string;
    name: string;
    rating: number;
    follower_count: number;
    location: string;
  };
  shipping: {
    shipping_fee: number;
    free_shipping: boolean;
    estimated_days: number;
    shipping_method: string;
  };
  category: {
    id: string;
    name: string;
    parent_id?: string;
  };
  tags: string[];
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    images: string[];
  }>;
}

export interface WishSearchResponse {
  products: WishSearchResult[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface WishOrderResponse {
  orders: Array<{
    id: string;
    status: string;
    created_time: number;
    updated_time: number;
    buyer: {
      id: string;
      username: string;
      email: string;
    };
    shipping_address: {
      name: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      zipcode: string;
      country: string;
    };
    items: Array<{
      product_id: string;
      product_name: string;
      variant_id?: string;
      variant_name?: string;
      quantity: number;
      price: number;
      currency: string;
    }>;
    total_amount: number;
    currency: string;
    payment_method: string;
    shipping_fee: number;
    tax_amount: number;
    discount_amount: number;
    final_amount: number;
  }>;
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

@Injectable()
export class WishService {
  private readonly logger = new Logger(WishService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl = 'https://merchant.wish.com/api/v3';
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.clientId = this.configService.get<string>('WISH_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('WISH_CLIENT_SECRET') || '';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoL-Pithing/1.0.0',
      },
    });

    // Interceptor para logging
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.log(`Wish API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error(`Wish API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.message}`);
        throw error;
      }
    );
  }

  /**
   * OAuth 2.0 - Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<WishTokenResponse> {
    try {
      const response = await this.httpClient.post('/oauth/access_token', {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
      });

      const tokenData: WishTokenResponse = response.data;
      
      // Cache token data
      await this.redisService.setex(
        `wish:token:${tokenData.merchant_id}`,
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
   * OAuth 2.0 - Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<WishTokenResponse> {
    try {
      const response = await this.httpClient.post('/oauth/access_token', {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error refreshing token:', error);
      throw new HttpException('Failed to refresh token', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Search products for authorized merchants
   */
  async searchProducts(params: WishSearchParams, accessToken: string): Promise<WishSearchResponse> {
    try {
      const cacheKey = `wish:search:${JSON.stringify(params)}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        this.logger.log(`Cache hit for Wish search: ${params.query}`);
        return JSON.parse(cached);
      }

      const searchParams = {
        ...params,
        access_token: accessToken,
      };

      const response = await this.httpClient.get('/products/search', {
        params: searchParams,
      });

      const searchData: WishSearchResponse = response.data;
      
      // Cache for 5 minutes
      await this.redisService.setex(cacheKey, 300, JSON.stringify(searchData));

      return searchData;
    } catch (error) {
      this.logger.error('Error in Wish product search:', error);
      throw new HttpException('Failed to search products', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get product details by ID
   */
  async getProduct(productId: string, accessToken: string): Promise<WishSearchResult> {
    try {
      const cacheKey = `wish:product:${productId}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.httpClient.get(`/products/${productId}`, {
        params: {
          access_token: accessToken,
        },
      });

      const productData: WishSearchResult = response.data;
      
      // Cache for 1 hour
      await this.redisService.setex(cacheKey, 3600, JSON.stringify(productData));

      return productData;
    } catch (error) {
      this.logger.error(`Error getting Wish product ${productId}:`, error);
      throw new HttpException('Failed to get product details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get merchant information
   */
  async getMerchantInfo(merchantId: string, accessToken: string): Promise<any> {
    try {
      const cacheKey = `wish:merchant:${merchantId}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.httpClient.get(`/merchants/${merchantId}`, {
        params: {
          access_token: accessToken,
        },
      });

      const merchantData = response.data;
      
      // Cache for 1 hour
      await this.redisService.setex(cacheKey, 3600, JSON.stringify(merchantData));

      return merchantData;
    } catch (error) {
      this.logger.error(`Error getting Wish merchant ${merchantId}:`, error);
      throw new HttpException('Failed to get merchant details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get orders for authorized merchants
   */
  async getOrders(accessToken: string, params: any = {}): Promise<WishOrderResponse> {
    try {
      const cacheKey = `wish:orders:${JSON.stringify(params)}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const orderParams = {
        ...params,
        access_token: accessToken,
      };

      const response = await this.httpClient.get('/orders', {
        params: orderParams,
      });

      const orderData: WishOrderResponse = response.data;
      
      // Cache for 10 minutes
      await this.redisService.setex(cacheKey, 600, JSON.stringify(orderData));

      return orderData;
    } catch (error) {
      this.logger.error('Error getting Wish orders:', error);
      throw new HttpException('Failed to get orders', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get categories
   */
  async getCategories(accessToken: string): Promise<any[]> {
    try {
      const cacheKey = 'wish:categories';
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.httpClient.get('/categories', {
        params: {
          access_token: accessToken,
        },
      });

      const categories = response.data.categories || [];
      
      // Cache for 24 hours
      await this.redisService.setex(cacheKey, 86400, JSON.stringify(categories));

      return categories;
    } catch (error) {
      this.logger.error('Error getting Wish categories:', error);
      throw new HttpException('Failed to get categories', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(accessToken: string, limit: number = 20): Promise<WishSearchResult[]> {
    try {
      const cacheKey = `wish:trending:${limit}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.httpClient.get('/products/trending', {
        params: {
          access_token: accessToken,
          limit,
        },
      });

      const trendingProducts = response.data.products || [];
      
      // Cache for 1 hour
      await this.redisService.setex(cacheKey, 3600, JSON.stringify(trendingProducts));

      return trendingProducts;
    } catch (error) {
      this.logger.error('Error getting Wish trending products:', error);
      throw new HttpException('Failed to get trending products', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get product reviews
   */
  async getProductReviews(productId: string, accessToken: string, params: any = {}): Promise<any[]> {
    try {
      const cacheKey = `wish:reviews:${productId}:${JSON.stringify(params)}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.httpClient.get(`/products/${productId}/reviews`, {
        params: {
          ...params,
          access_token: accessToken,
        },
      });

      const reviews = response.data.reviews || [];
      
      // Cache for 1 hour
      await this.redisService.setex(cacheKey, 3600, JSON.stringify(reviews));

      return reviews;
    } catch (error) {
      this.logger.error(`Error getting Wish reviews for product ${productId}:`, error);
      throw new HttpException('Failed to get product reviews', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'read_products,read_orders,read_merchant',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://merchant.wish.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Health check for Wish API
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.clientId || !this.clientSecret) {
        return false;
      }

      const response = await this.httpClient.get('/health');
      return response.status === 200;
    } catch (error) {
      this.logger.error('Wish API health check failed:', error);
      return false;
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!(this.clientId && this.clientSecret);
  }
}
