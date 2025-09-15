// Tipos principais do sistema

export interface Marketplace {
  id: string;
  name: string;
  code: 'MLB' | 'SHOPEE' | 'WISH';
  site_id?: string; // para ML
  created_at: Date;
  updated_at: Date;
}

export interface Seller {
  id: string;
  marketplace_id: string;
  external_id: string;
  name: string;
  reputation_score: number;
  country: string;
  metrics_json: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  title: string;
  brand?: string;
  gtin?: string;
  model?: string;
  category_canonical: string;
  attributes_json: Record<string, any>;
  image_primary_url?: string;
  created_at: Date;
  updated_at: Date;
  source: string;
}

export interface Listing {
  id: string;
  marketplace_id: string;
  seller_id: string;
  product_id: string;
  external_item_id: string;
  title_raw: string;
  category_market: string;
  price_amount: number;
  price_currency: string;
  shipping_json: Record<string, any>;
  stock: number;
  rating_avg?: number;
  rating_count?: number;
  url: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: Date;
  updated_at: Date;
}

export interface Price {
  id: string;
  listing_id: string;
  amount: number;
  currency: string;
  timestamp: Date;
}

export interface Review {
  id: string;
  listing_id: string;
  rating: number;
  title?: string;
  content?: string;
  lang: string;
  created_at_ext: Date;
  author_json: Record<string, any>;
}

export interface Image {
  id: string;
  product_id?: string;
  listing_id?: string;
  url: string;
  storage_key: string;
  hash: string;
}

export interface Embedding {
  id: string;
  product_id?: string;
  listing_id?: string;
  vector: number[];
  modality: 'text' | 'image';
  model: string;
}

export interface Category {
  id: string;
  marketplace_id: string;
  external_id: string;
  name: string;
  parent_id?: string;
}

export interface Job {
  id: string;
  type: string;
  payload_json: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  last_error?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Audit {
  id: string;
  entity: string;
  entity_id: string;
  action: string;
  diff_json: Record<string, any>;
  created_at: Date;
  actor: string;
}

// Tipos para APIs externas

export interface MeliSearchResult {
  results: MeliItem[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
  filters?: any[];
}

export interface MeliItem {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  thumbnail: string;
  permalink: string;
  seller: {
    id: number;
    nickname: string;
    reputation: {
      level_id: string;
      power_seller_status: string;
    };
  };
  shipping: {
    free_shipping: boolean;
    mode: string;
  };
  attributes: Array<{
    id: string;
    name: string;
    value_name: string;
  }>;
}

export interface ShopeeAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  shop_id: string;
}

export interface WishAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Tipos para busca e ranking

export interface SearchFilters {
  price_min?: number;
  price_max?: number;
  rating_min?: number;
  marketplace?: string[];
  country?: string;
  free_shipping?: boolean;
}

export interface SearchResult {
  listings: ListingWithScore[];
  total: number;
  filters_applied: SearchFilters;
}

export interface ListingWithScore extends Listing {
  score: number;
  explanation: ScoreExplanation;
  seller_reputation: string;
}

export interface ScoreExplanation {
  demanda: number;
  qualidade: number;
  preco: number;
  logistica: number;
  reputacao: number;
  penalty: number;
  gtin_match?: boolean;
  brand_match?: boolean;
  title_similarity?: number;
  image_similarity?: number;
}

export interface RankingFeatures {
  demanda?: number;
  qualidade?: number;
  preco?: number; // menor é melhor
  logistica?: number;
  reputacao?: number;
  penalty?: number;
}

export interface ValidationChecklist {
  imagem_semelhante: boolean;
  titulo_brand_model: boolean;
  gtin_ean_upc: boolean;
  especificacoes: boolean;
  preco_plausivel: boolean;
  reputacao_vendedor: boolean;
}

export interface ValidationResult {
  status: 'confirmed' | 'probable' | 'denied';
  checklist: ValidationChecklist;
  confidence: number;
  explanation: string;
}

// Tipos para upload de imagem

export interface ImageSearchRequest {
  file: File;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ImageSearchResult {
  candidates: ImageCandidate[];
  processing_time: number;
  model_used: string;
}

export interface ImageCandidate {
  product_id: string;
  title: string;
  image_url: string;
  score: number;
  listings: ListingWithScore[];
  explanation: ScoreExplanation;
}
