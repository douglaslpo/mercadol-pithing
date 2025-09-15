import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { RedisService } from '../redis/redis.service';

export interface AlibabaImageSearchResult {
  success: boolean;
  data?: {
    results: Array<{
      title: string;
      image_url: string;
      similarity: number;
      product_url?: string;
    }>;
  };
  error?: string;
}

@Injectable()
export class AlibabaImageService {
  private readonly logger = new Logger(AlibabaImageService.name);
  private readonly httpClient: AxiosInstance;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly accessKeySecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.region = this.configService.get('ALIYUN_REGION') || 'cn-hangzhou';
    this.accessKeyId = this.configService.get('ALIYUN_ACCESS_KEY_ID');
    this.accessKeySecret = this.configService.get('ALIYUN_ACCESS_KEY_SECRET');

    this.httpClient = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'MercadoL-Pithing/1.0',
      },
    });

    if (!this.accessKeyId || !this.accessKeySecret) {
      this.logger.warn('Credenciais Alibaba Cloud não configuradas - busca por imagem desabilitada');
    }
  }

  /**
   * Busca por imagem usando Alibaba Cloud Image Search
   */
  async searchByImage(file: Express.Multer.File): Promise<AlibabaImageSearchResult> {
    if (!this.accessKeyId || !this.accessKeySecret) {
      this.logger.warn('Credenciais Alibaba Cloud não disponíveis');
      return {
        success: false,
        error: 'Credenciais Alibaba Cloud não configuradas',
      };
    }

    try {
      this.logger.log(`Buscando por imagem usando Alibaba Cloud: ${file.originalname}`);

      // Verificar cache
      const imageHash = crypto.createHash('md5').update(file.buffer).digest('hex');
      const cacheKey = `alibaba:image_search:${imageHash}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        this.logger.log('Cache hit for Alibaba image search');
        return JSON.parse(cached);
      }

      // Converter imagem para base64
      const base64Image = file.buffer.toString('base64');

      // Preparar parâmetros da API
      const params = {
        Action: 'SearchImage',
        Version: '2019-03-25',
        RegionId: this.region,
        CategoryId: 'general', // Categoria geral
        PicContent: base64Image,
        Start: 0,
        Num: 10, // Máximo 10 resultados
      };

      // Gerar assinatura
      const signature = this.generateSignature(params);

      // Fazer requisição
      const response = await this.httpClient.post(
        `https://imagesearch.${this.region}.aliyuncs.com`,
        new URLSearchParams({
          ...params,
          Signature: signature,
          AccessKeyId: this.accessKeyId,
          Format: 'JSON',
          SignatureMethod: 'HMAC-SHA1',
          SignatureVersion: '1.0',
          SignatureNonce: this.generateNonce(),
          Timestamp: new Date().toISOString(),
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data.Code === 'Success') {
        const result = {
          success: true,
          data: {
            results: response.data.Data?.Results?.map((item: any) => ({
              title: item.Title || 'Produto não identificado',
              image_url: item.ImageUrl || '',
              similarity: item.Similarity || 0,
              product_url: item.ProductUrl,
            })) || [],
          },
        };

        // Cache for 1 hour
        await this.redisService.setex(cacheKey, 3600, JSON.stringify(result));

        return result;
      } else {
        this.logger.error(`Erro Alibaba Cloud: ${response.data.Message}`);
        return {
          success: false,
          error: response.data.Message || 'Erro desconhecido',
        };
      }
    } catch (error) {
      this.logger.error(`Erro na busca por imagem Alibaba: ${error.message}`, error.stack);
      return {
        success: false,
        error: `Falha na busca por imagem: ${error.message}`,
      };
    }
  }

  /**
   * Gerar assinatura HMAC-SHA1 para Alibaba Cloud
   */
  private generateSignature(params: Record<string, any>): string {
    // Ordenar parâmetros
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${this.encode(key)}=${this.encode(params[key])}`)
      .join('&');

    // String para assinar
    const stringToSign = `POST&${this.encode('/')}&${this.encode(sortedParams)}`;

    // Gerar assinatura
    const signature = crypto
      .createHmac('sha1', `${this.accessKeySecret}&`)
      .update(stringToSign)
      .digest('base64');

    return signature;
  }

  /**
   * URL encode
   */
  private encode(str: string): string {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  }

  /**
   * Gerar nonce único
   */
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Verificar se o serviço está disponível
   */
  isAvailable(): boolean {
    return !!(this.accessKeyId && this.accessKeySecret);
  }

  /**
   * Buscar produtos similares por URL de imagem
   */
  async searchByImageUrl(imageUrl: string): Promise<AlibabaImageSearchResult> {
    try {
      const cacheKey = `alibaba:image_search_url:${crypto.createHash('md5').update(imageUrl).digest('hex')}`;
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const params = {
        Action: 'SearchImageByUrl',
        Version: '2019-03-25',
        RegionId: this.region,
        ImageUrl: imageUrl,
        Start: 0,
        Num: 10,
      };

      const signature = this.generateSignature(params);

      const response = await this.httpClient.post(
        `https://imagesearch.${this.region}.aliyuncs.com`,
        new URLSearchParams({
          ...params,
          Signature: signature,
          AccessKeyId: this.accessKeyId,
          Format: 'JSON',
          SignatureMethod: 'HMAC-SHA1',
          SignatureVersion: '1.0',
          SignatureNonce: this.generateNonce(),
          Timestamp: new Date().toISOString(),
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data.Code === 'Success') {
        const result = {
          success: true,
          data: {
            results: response.data.Data?.Results?.map((item: any) => ({
              title: item.Title || 'Produto não identificado',
              image_url: item.ImageUrl || '',
              similarity: item.Similarity || 0,
              product_url: item.ProductUrl,
            })) || [],
          },
        };

        // Cache for 1 hour
        await this.redisService.setex(cacheKey, 3600, JSON.stringify(result));

        return result;
      } else {
        return {
          success: false,
          error: response.data.Message || 'Erro desconhecido',
        };
      }
    } catch (error) {
      this.logger.error(`Erro na busca por URL de imagem: ${error.message}`);
      return {
        success: false,
        error: `Falha na busca por URL: ${error.message}`,
      };
    }
  }

  /**
   * Obter categorias disponíveis para busca por imagem
   */
  async getCategories(): Promise<any[]> {
    try {
      const cacheKey = 'alibaba:image_categories';
      const cached = await this.redisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const params = {
        Action: 'GetCategories',
        Version: '2019-03-25',
        RegionId: this.region,
      };

      const signature = this.generateSignature(params);

      const response = await this.httpClient.post(
        `https://imagesearch.${this.region}.aliyuncs.com`,
        new URLSearchParams({
          ...params,
          Signature: signature,
          AccessKeyId: this.accessKeyId,
          Format: 'JSON',
          SignatureMethod: 'HMAC-SHA1',
          SignatureVersion: '1.0',
          SignatureNonce: this.generateNonce(),
          Timestamp: new Date().toISOString(),
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data.Code === 'Success') {
        const categories = response.data.Categories || [];
        
        // Cache for 24 hours
        await this.redisService.setex(cacheKey, 86400, JSON.stringify(categories));

        return categories;
      } else {
        return this.getMockCategories();
      }
    } catch (error) {
      this.logger.error(`Erro ao obter categorias: ${error.message}`);
      return this.getMockCategories();
    }
  }

  /**
   * Health check para Alibaba Cloud Image Search
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.accessKeyId || !this.accessKeySecret) {
        return false;
      }

      const params = {
        Action: 'GetCategories',
        Version: '2019-03-25',
        RegionId: this.region,
      };

      const signature = this.generateSignature(params);

      const response = await this.httpClient.post(
        `https://imagesearch.${this.region}.aliyuncs.com`,
        new URLSearchParams({
          ...params,
          Signature: signature,
          AccessKeyId: this.accessKeyId,
          Format: 'JSON',
          SignatureMethod: 'HMAC-SHA1',
          SignatureVersion: '1.0',
          SignatureNonce: this.generateNonce(),
          Timestamp: new Date().toISOString(),
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error('Alibaba Image Search health check failed:', error);
      return false;
    }
  }

  /**
   * Obter categorias simuladas para testes
   */
  private getMockCategories(): any[] {
    return [
      {
        CategoryId: 'MLB1055',
        CategoryName: 'Celulares e Smartphones',
        ParentCategoryId: 'MLB1000',
        Level: 2,
      },
      {
        CategoryId: 'MLB1430',
        CategoryName: 'Eletrônicos, Áudio e Vídeo',
        ParentCategoryId: 'MLB1000',
        Level: 2,
      },
      {
        CategoryId: 'MLB1574',
        CategoryName: 'Informática',
        ParentCategoryId: 'MLB1000',
        Level: 2,
      },
      {
        CategoryId: 'MLB1132',
        CategoryName: 'Casa e Jardim',
        ParentCategoryId: 'MLB1000',
        Level: 2,
      },
      {
        CategoryId: 'MLB1276',
        CategoryName: 'Esportes e Fitness',
        ParentCategoryId: 'MLB1000',
        Level: 2,
      },
    ];
  }
}
