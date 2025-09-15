import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly embeddingsServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.embeddingsServiceUrl = this.configService.get('EMBEDDINGS_SERVICE_URL') || 'http://embeddings:3002';
  }

  /**
   * Gerar embedding de texto usando SBERT
   */
  async generateTextEmbedding(text: string): Promise<number[]> {
    try {
      this.logger.debug(`Gerando embedding de texto: "${text.substring(0, 50)}..."`);

      const response = await axios.post(`${this.embeddingsServiceUrl}/api/embeddings/text`, {
        text: text.trim(),
      }, {
        timeout: 10000,
      });

      return response.data.embedding;
    } catch (error) {
      this.logger.error(`Erro ao gerar embedding de texto: ${error.message}`);
      throw new Error(`Falha na geração de embedding de texto: ${error.message}`);
    }
  }

  /**
   * Gerar embedding de imagem usando CLIP
   */
  async generateImageEmbedding(imageBuffer: Buffer): Promise<number[]> {
    try {
      this.logger.debug(`Gerando embedding de imagem (${imageBuffer.length} bytes)`);

      const formData = new FormData();
      formData.append('image', new Blob([imageBuffer]), 'image.jpg');

      const response = await axios.post(`${this.embeddingsServiceUrl}/api/embeddings/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 15000,
      });

      return response.data.embedding;
    } catch (error) {
      this.logger.error(`Erro ao gerar embedding de imagem: ${error.message}`);
      throw new Error(`Falha na geração de embedding de imagem: ${error.message}`);
    }
  }

  /**
   * Buscar produtos similares por embedding de texto
   */
  async searchByTextEmbedding(embedding: number[], limit: number = 10): Promise<any[]> {
    try {
      this.logger.debug(`Buscando produtos similares por texto (limite: ${limit})`);

      const response = await axios.post(`${this.embeddingsServiceUrl}/api/search/text`, {
        embedding,
        limit,
      }, {
        timeout: 10000,
      });

      return response.data.results || [];
    } catch (error) {
      this.logger.error(`Erro na busca por embedding de texto: ${error.message}`);
      throw new Error(`Falha na busca por similaridade de texto: ${error.message}`);
    }
  }

  /**
   * Buscar produtos similares por embedding de imagem
   */
  async searchByImageEmbedding(embedding: number[], limit: number = 10): Promise<any[]> {
    try {
      this.logger.debug(`Buscando produtos similares por imagem (limite: ${limit})`);

      const response = await axios.post(`${this.embeddingsServiceUrl}/api/search/image`, {
        embedding,
        limit,
      }, {
        timeout: 10000,
      });

      return response.data.results || [];
    } catch (error) {
      this.logger.error(`Erro na busca por embedding de imagem: ${error.message}`);
      throw new Error(`Falha na busca por similaridade de imagem: ${error.message}`);
    }
  }

  /**
   * Calcular similaridade de texto usando cosine similarity
   */
  async calculateTextSimilarity(text1: string, text2: string): Promise<number> {
    try {
      const response = await axios.post(`${this.embeddingsServiceUrl}/api/similarity/text`, {
        text1: text1.trim(),
        text2: text2.trim(),
      }, {
        timeout: 10000,
      });

      return response.data.similarity;
    } catch (error) {
      this.logger.error(`Erro no cálculo de similaridade de texto: ${error.message}`);
      // Fallback: usar distância de Levenshtein normalizada
      return this.calculateLevenshteinSimilarity(text1, text2);
    }
  }

  /**
   * Calcular similaridade de imagem usando cosine similarity
   */
  async calculateImageSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
    try {
      const response = await axios.post(`${this.embeddingsServiceUrl}/api/similarity/image`, {
        embedding1,
        embedding2,
      }, {
        timeout: 10000,
      });

      return response.data.similarity;
    } catch (error) {
      this.logger.error(`Erro no cálculo de similaridade de imagem: ${error.message}`);
      // Fallback: calcular cosine similarity localmente
      return this.calculateCosineSimilarity(embedding1, embedding2);
    }
  }

  /**
   * Calcular cosine similarity localmente (fallback)
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Calcular similaridade usando distância de Levenshtein (fallback)
   */
  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    
    if (maxLength === 0) return 1;
    
    return 1 - (distance / maxLength);
  }

  /**
   * Calcular distância de Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Verificar se o serviço de embeddings está disponível
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.embeddingsServiceUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Serviço de embeddings não disponível: ${error.message}`);
      return false;
    }
  }
}
