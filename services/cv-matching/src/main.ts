import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const logger = createLogger();
const port = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'cv-matching',
    version: '1.0.0',
  });
});

// Embeddings endpoints
app.post('/api/embeddings/text', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto é obrigatório' });
    }

    // TODO: Implementar geração real de embedding usando SBERT
    // Por enquanto, retornar embedding simulado
    const embedding = Array.from({ length: 768 }, () => Math.random() - 0.5);
    
    res.json({
      embedding,
      model: 'sbert-all-MiniLM-L6-v2',
      text_length: text.length,
    });
  } catch (error) {
    logger.error('Erro ao gerar embedding de texto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/embeddings/image', async (req, res) => {
  try {
    // TODO: Implementar upload de imagem e geração de embedding usando CLIP
    // Por enquanto, retornar embedding simulado
    const embedding = Array.from({ length: 512 }, () => Math.random() - 0.5);
    
    res.json({
      embedding,
      model: 'clip-vit-base-patch32',
      image_size: 'simulated',
    });
  } catch (error) {
    logger.error('Erro ao gerar embedding de imagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/similarity/text', async (req, res) => {
  try {
    const { text1, text2 } = req.body;
    
    if (!text1 || !text2) {
      return res.status(400).json({ error: 'Ambos os textos são obrigatórios' });
    }

    // TODO: Implementar cálculo real de similaridade
    // Por enquanto, retornar similaridade simulada
    const similarity = Math.random();
    
    res.json({
      similarity,
      text1_length: text1.length,
      text2_length: text2.length,
    });
  } catch (error) {
    logger.error('Erro ao calcular similaridade de texto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/similarity/image', async (req, res) => {
  try {
    const { embedding1, embedding2 } = req.body;
    
    if (!embedding1 || !embedding2) {
      return res.status(400).json({ error: 'Ambos os embeddings são obrigatórios' });
    }

    // Calcular cosine similarity
    const similarity = calculateCosineSimilarity(embedding1, embedding2);
    
    res.json({
      similarity,
      embedding1_length: embedding1.length,
      embedding2_length: embedding2.length,
    });
  } catch (error) {
    logger.error('Erro ao calcular similaridade de imagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/search/text', async (req, res) => {
  try {
    const { embedding, limit = 10 } = req.body;
    
    if (!embedding) {
      return res.status(400).json({ error: 'Embedding é obrigatório' });
    }

    // TODO: Implementar busca real no banco de dados
    // Por enquanto, retornar resultados simulados
    const results = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: `product_${i + 1}`,
      title: `Produto Simulado ${i + 1}`,
      similarity: Math.random(),
      marketplace: 'MLB',
    }));
    
    res.json({
      results,
      total: results.length,
      query_embedding_length: embedding.length,
    });
  } catch (error) {
    logger.error('Erro na busca por texto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/search/image', async (req, res) => {
  try {
    const { embedding, limit = 10 } = req.body;
    
    if (!embedding) {
      return res.status(400).json({ error: 'Embedding é obrigatório' });
    }

    // TODO: Implementar busca real no banco de dados
    // Por enquanto, retornar resultados simulados
    const results = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: `product_${i + 1}`,
      title: `Produto Simulado ${i + 1}`,
      similarity: Math.random(),
      marketplace: 'MLB',
      image_url: `https://example.com/image_${i + 1}.jpg`,
    }));
    
    res.json({
      results,
      total: results.length,
      query_embedding_length: embedding.length,
    });
  } catch (error) {
    logger.error('Erro na busca por imagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função auxiliar para calcular cosine similarity
function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
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

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 Serviço CV Matching rodando na porta ${port}`);
  logger.info(`📊 Health check disponível em http://localhost:${port}/health`);
});

export default app;
