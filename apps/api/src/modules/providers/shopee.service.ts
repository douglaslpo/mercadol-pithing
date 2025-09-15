import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { RedisService } from '../redis/redis.service';
import { shopeeSign } from '@packages/shared/shopee/sign';

export interface ShopeeTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  shop_id: number;
  partner_id: number;
}

export interface ShopeeSearchParams {
  keyword?: string;
  category_id?: number;
  price_min?: number;
  price_max?: number;
  sort_by?: 'relevancy' | 'ctime' | 'sales' | 'price';
  sort_order?: 'asc' | 'desc';
  page_size?: number;
  page_number?: number;
  shop_id?: number;
}

export interface ShopeeSearchResult {
  item_id: number;
  item_name: string;
  item_sku: string;
  price: number;
  currency: string;
  stock: number;
  condition: string;
  item_status: string;
  create_time: number;
  update_time: number;
  images: string[];
  description: string;
  item_rating: {
    rating_star: number;
    rating_count: number;
  };
  shop_info: {
    shop_id: number;
    shop_name: string;
    shop_location: string;
    shop_rating: number;
    shop_follower_count: number;
  };
  logistics_info: {
    logistics_id: number;
    logistics_name: string;
    logistics_type: string;
    shipping_fee: number;
    free_shipping: boolean;
  };
  category_info: {
    category_id: number;
    category_name: string;
    parent_category_id: number;
  };
}

export interface ShopeeSearchResponse {
  items: ShopeeSearchResult[];
  total_count: number;
  page_number: number;
  page_size: number;
  has_next_page: boolean;
}

export interface ShopeeOrderResponse {
  orders: Array<{
    order_id: number;
    order_status: string;
    create_time: number;
    update_time: number;
    buyer_user_id: number;
    buyer_username: string;
    recipient_address: {
      name: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      zipcode: string;
      country: string;
    };
    item_list: Array<{
      item_id: number;
      item_name: string;
      item_sku: string;
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
  page_number: number;
  page_size: number;
  has_next_page: boolean;
}

@Injectable()
export class ShopeeService {
  private readonly logger = new Logger(ShopeeService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl = 'https://partner.shopeemobile.com/api/v2';
  private readonly partnerId: string;
  private readonly partnerKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.partnerId = this.configService.get<string>('SHOPEE_PARTNER_ID') || '';
    this.partnerKey = this.configService.get<string>('SHOPEE_PARTNER_KEY') || '';

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
        this.logger.log(`Shopee API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error(`Shopee API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.message}`);
        throw error;
      }
    );
  }

  /**
   * OAuth 2.0 - Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<ShopeeTokenResponse> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const apiPath = '/auth/token/get';
      
      const params = {
        partner_id: this.partnerId,
        code,
        redirect_uri: redirectUri,
        timestamp,
      };

      const signature = shopeeSign({
        partnerId: this.partnerId,
        partnerKey: this.partnerKey,
        apiPath,
        timestamp,
      });

      const response = await this.httpClient.post(apiPath, {
        ...params,
        sign: signature,
      });

      const tokenData: ShopeeTokenResponse = response.data;
      
      // Cache token data
      await this.redisService.setex(
        `shopee:token:${tokenData.shop_id}`,
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
  async refreshToken(refreshToken: string, shopId: number): Promise<ShopeeTokenResponse> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const apiPath = '/auth/token/refresh';
      
      const params = {
        partner_id: this.partnerId,
        refresh_token: refreshToken,
        shop_id: shopId,
        timestamp,
      };

      const signature = shopeeSign({
        partnerId: this.partnerId,
        partnerKey: this.partnerKey,
        apiPath,
        timestamp,
        accessToken: refreshToken,
        shopId: shopId.toString(),
      });

      const response = await this.httpClient.post(apiPath, {
        ...params,
        sign: signature,
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
  async searchProducts(params: ShopeeSearchParams, accessToken: string, shopId: number): Promise<ShopeeSearchResponse> {
    try {
      const cacheKey = `shopee:search:${shopId}:${JSON.stringify(params)}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        this.logger.log(`Cache hit for Shopee search: ${params.keyword}`);
        return JSON.parse(cached);
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const apiPath = '/product/get_item_list';
      
      const searchParams = {
        partner_id: this.partnerId,
        shop_id: shopId,
        page_size: params.page_size || 20,
        page_number: params.page_number || 1,
        timestamp,
      };

      // Add optional parameters
      if (params.keyword) {
        searchParams['keyword'] = params.keyword;
      }
      if (params.category_id) {
        searchParams['category_id'] = params.category_id;
      }
      if (params.price_min) {
        searchParams['price_min'] = params.price_min;
      }
      if (params.price_max) {
        searchParams['price_max'] = params.price_max;
      }
      if (params.sort_by) {
        searchParams['sort_by'] = params.sort_by;
      }
      if (params.sort_order) {
        searchParams['sort_order'] = params.sort_order;
      }

      const signature = shopeeSign({
        partnerId: this.partnerId,
        partnerKey: this.partnerKey,
        apiPath,
        timestamp,
        accessToken,
        shopId: shopId.toString(),
      });

      const response = await this.httpClient.post(apiPath, {
        ...searchParams,
        sign: signature,
      });

      const searchData: ShopeeSearchResponse = response.data;
      
      // Cache for 5 minutes
      await this.redisService.setex(cacheKey, 300, JSON.stringify(searchData));

      return searchData;
    } catch (error) {
      this.logger.error('Error in Shopee product search:', error);
      throw new HttpException('Failed to search products', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get product details by ID
   */
  async getProduct(itemId: number, accessToken: string, shopId: number): Promise<ShopeeSearchResult> {
    try {
      const cacheKey = `shopee:product:${shopId}:${itemId}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const apiPath = '/product/get_item_detail';
      
      const params = {
        partner_id: this.partnerId,
        shop_id: shopId,
        item_id: itemId,
        timestamp,
      };

      const signature = shopeeSign({
        partnerId: this.partnerId,
        partnerKey: this.partnerKey,
        apiPath,
        timestamp,
        accessToken,
        shopId: shopId.toString(),
      });

      const response = await this.httpClient.post(apiPath, {
        ...params,
        sign: signature,
      });

      const productData: ShopeeSearchResult = response.data;
      
      // Cache for 1 hour
      await this.redisService.setex(cacheKey, 3600, JSON.stringify(productData));

      return productData;
    } catch (error) {
      this.logger.error(`Error getting Shopee product ${itemId}:`, error);
      throw new HttpException('Failed to get product details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get shop information
   */
  async getShopInfo(shopId: number, accessToken: string): Promise<any> {
    try {
      const cacheKey = `shopee:shop:${shopId}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const apiPath = '/shop/get_shop_info';
      
      const params = {
        partner_id: this.partnerId,
        shop_id: shopId,
        timestamp,
      };

      const signature = shopeeSign({
        partnerId: this.partnerId,
        partnerKey: this.partnerKey,
        apiPath,
        timestamp,
        accessToken,
        shopId: shopId.toString(),
      });

      const response = await this.httpClient.post(apiPath, {
        ...params,
        sign: signature,
      });

      const shopData = response.data;
      
      // Cache for 1 hour
      await this.redisService.setex(cacheKey, 3600, JSON.stringify(shopData));

      return shopData;
    } catch (error) {
      this.logger.error(`Error getting Shopee shop ${shopId}:`, error);
      throw new HttpException('Failed to get shop details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get orders for authorized merchants
   */
  async getOrders(accessToken: string, shopId: number, params: any = {}): Promise<ShopeeOrderResponse> {
    try {
      const cacheKey = `shopee:orders:${shopId}:${JSON.stringify(params)}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const apiPath = '/order/get_order_list';
      
      const orderParams = {
        partner_id: this.partnerId,
        shop_id: shopId,
        page_size: params.page_size || 20,
        page_number: params.page_number || 1,
        timestamp,
      };

      // Add optional parameters
      if (params.order_status) {
        orderParams['order_status'] = params.order_status;
      }
      if (params.create_time_from) {
        orderParams['create_time_from'] = params.create_time_from;
      }
      if (params.create_time_to) {
        orderParams['create_time_to'] = params.create_time_to;
      }

      const signature = shopeeSign({
        partnerId: this.partnerId,
        partnerKey: this.partnerKey,
        apiPath,
        timestamp,
        accessToken,
        shopId: shopId.toString(),
      });

      const response = await this.httpClient.post(apiPath, {
        ...orderParams,
        sign: signature,
      });

      const orderData: ShopeeOrderResponse = response.data;
      
      // Cache for 10 minutes
      await this.redisService.setex(cacheKey, 600, JSON.stringify(orderData));

      return orderData;
    } catch (error) {
      this.logger.error(`Error getting Shopee orders for shop ${shopId}:`, error);
      throw new HttpException('Failed to get orders', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get categories
   */
  async getCategories(accessToken: string, shopId: number): Promise<any[]> {
    try {
      const cacheKey = `shopee:categories:${shopId}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const apiPath = '/product/get_category';
      
      const params = {
        partner_id: this.partnerId,
        shop_id: shopId,
        timestamp,
      };

      const signature = shopeeSign({
        partnerId: this.partnerId,
        partnerKey: this.partnerKey,
        apiPath,
        timestamp,
        accessToken,
        shopId: shopId.toString(),
      });

      const response = await this.httpClient.post(apiPath, {
        ...params,
        sign: signature,
      });

      const categories = response.data.categories || [];
      
      // Cache for 24 hours
      await this.redisService.setex(cacheKey, 86400, JSON.stringify(categories));

      return categories;
    } catch (error) {
      this.logger.error('Error getting Shopee categories:', error);
      throw new HttpException('Failed to get categories', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.partnerId,
      redirect_uri: redirectUri,
    });

    if (state) {
      params.append('state', state);
    }

    return `https://partner.shopeemobile.com/api/v2/shop/auth_partner?${params.toString()}`;
  }

  /**
   * Health check for Shopee API
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.partnerId || !this.partnerKey) {
        return false;
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const apiPath = '/shop/get_shop_info';
      
      const params = {
        partner_id: this.partnerId,
        shop_id: 0, // Test shop ID
        timestamp,
      };

      const signature = shopeeSign({
        partnerId: this.partnerId,
        partnerKey: this.partnerKey,
        apiPath,
        timestamp,
      });

      const response = await this.httpClient.post(apiPath, {
        ...params,
        sign: signature,
      });

      return response.status === 200;
    } catch (error) {
      this.logger.error('Shopee API health check failed:', error);
      return false;
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!(this.partnerId && this.partnerKey);
  }
}
