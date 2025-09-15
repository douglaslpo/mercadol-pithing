import { RankingFeatures, ScoreExplanation } from '../types';

/**
 * Calcula score de ranking baseado em features normalizadas
 */
export function rankingScore(
  features: RankingFeatures,
  weights = {
    demanda: 0.3,
    qualidade: 0.25,
    preco: 0.2,
    logistica: 0.15,
    reputacao: 0.1,
    penalty: 0.2
  }
): { score: number; explanation: ScoreExplanation } {
  const norm = (x?: number) => x ?? 0;
  
  // Componente de preço: inverter se "preço relativo" (menor é melhor)
  const priceComponent = features.preco != null 
    ? (1 - Math.min(Math.max(features.preco, 0), 1)) 
    : 0;

  const explanation: ScoreExplanation = {
    demanda: norm(features.demanda),
    qualidade: norm(features.qualidade),
    preco: priceComponent,
    logistica: norm(features.logistica),
    reputacao: norm(features.reputacao),
    penalty: norm(features.penalty)
  };

  const score = 
    weights.demanda * explanation.demanda +
    weights.qualidade * explanation.qualidade +
    weights.preco * explanation.preco +
    weights.logistica * explanation.logistica +
    weights.reputacao * explanation.reputacao -
    weights.penalty * explanation.penalty;

  return {
    score: Math.max(0, Math.min(1, score)),
    explanation
  };
}

/**
 * Normaliza score de similaridade de texto usando cosine similarity
 */
export function normalizeTextSimilarity(cosineSimilarity: number): number {
  // Converter de [-1, 1] para [0, 1]
  return (cosineSimilarity + 1) / 2;
}

/**
 * Normaliza score de similaridade de imagem
 */
export function normalizeImageSimilarity(imageSimilarity: number): number {
  // Assumindo que já vem normalizado de 0 a 1
  return Math.max(0, Math.min(1, imageSimilarity));
}

/**
 * Calcula score de matching multimodal
 */
export function multimodalMatchingScore({
  gtinMatch,
  brandMatch,
  titleSimilarity,
  imageSimilarity,
  rulesScore
}: {
  gtinMatch: boolean;
  brandMatch: boolean;
  titleSimilarity: number;
  imageSimilarity: number;
  rulesScore: number;
}): { score: number; explanation: ScoreExplanation } {
  // GTIN idêntico = score máximo
  if (gtinMatch) {
    return {
      score: 0.99,
      explanation: {
        demanda: 0,
        qualidade: 0,
        preco: 0,
        logistica: 0,
        reputacao: 0,
        penalty: 0,
        gtin_match: true,
        brand_match: brandMatch,
        title_similarity: titleSimilarity,
        image_similarity: imageSimilarity
      }
    };
  }

  // Pesos para matching multimodal
  const weights = {
    text: 0.4,
    image: 0.3,
    rules: 0.3
  };

  const score = 
    weights.text * normalizeTextSimilarity(titleSimilarity) +
    weights.image * normalizeImageSimilarity(imageSimilarity) +
    weights.rules * rulesScore;

  return {
    score: Math.max(0, Math.min(1, score)),
    explanation: {
      demanda: 0,
      qualidade: 0,
      preco: 0,
      logistica: 0,
      reputacao: 0,
      penalty: 0,
      gtin_match: false,
      brand_match: brandMatch,
      title_similarity: titleSimilarity,
      image_similarity: imageSimilarity
    }
  };
}

/**
 * Calcula distância de Levenshtein normalizada
 */
export function levenshteinDistance(str1: string, str2: string): number {
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
 * Normaliza distância de Levenshtein para score de similaridade
 */
export function normalizeLevenshtein(str1: string, str2: string, threshold = 2): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  
  if (distance <= threshold) {
    return 1 - (distance / maxLength);
  }
  
  return 0;
}
