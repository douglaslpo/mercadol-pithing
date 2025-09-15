-- Inicialização do banco de dados PostgreSQL com pgvector
-- Este script é executado automaticamente quando o container PostgreSQL é criado

-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar schema principal
CREATE SCHEMA IF NOT EXISTS public;

-- Tabela de marketplaces
CREATE TABLE IF NOT EXISTS marketplaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    site_id VARCHAR(20), -- para ML
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sellers/vendedores
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    external_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    reputation_score DECIMAL(3,2) DEFAULT 0.0,
    country VARCHAR(3) NOT NULL,
    metrics_json JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(marketplace_id, external_id)
);

-- Tabela de produtos canônicos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    brand VARCHAR(100),
    gtin VARCHAR(20),
    model VARCHAR(100),
    category_canonical VARCHAR(100) NOT NULL,
    attributes_json JSONB DEFAULT '{}',
    image_primary_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'manual'
);

-- Tabela de listagens por marketplace
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    external_item_id VARCHAR(100) NOT NULL,
    title_raw VARCHAR(500) NOT NULL,
    category_market VARCHAR(100) NOT NULL,
    price_amount DECIMAL(10,2) NOT NULL,
    price_currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    shipping_json JSONB DEFAULT '{}',
    stock INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2),
    rating_count INTEGER DEFAULT 0,
    url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(marketplace_id, external_item_id)
);

-- Tabela de histórico de preços
CREATE TABLE IF NOT EXISTS prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de reviews/avaliações
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    lang VARCHAR(5) DEFAULT 'pt-BR',
    created_at_ext TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    author_json JSONB DEFAULT '{}'
);

-- Tabela de imagens
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de embeddings para busca semântica
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    vector vector(768), -- CLIP/SBERT embeddings
    modality VARCHAR(10) NOT NULL CHECK (modality IN ('text', 'image')),
    model VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    external_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(marketplace_id, external_id)
);

-- Tabela de jobs para processamento assíncrono
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    payload_json JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    diff_json JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actor VARCHAR(100) NOT NULL
);

-- Índices para performance

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_sellers_marketplace ON sellers(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_listings_marketplace ON listings(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_product ON listings(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_listing ON prices(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_images_product ON images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_listing ON images(listing_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_product ON embeddings(product_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_listing ON embeddings(listing_id);
CREATE INDEX IF NOT EXISTS idx_categories_marketplace ON categories(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_audits_entity ON audits(entity, entity_id);

-- Índices para JSONB
CREATE INDEX IF NOT EXISTS idx_sellers_metrics_gin ON sellers USING GIN (metrics_json);
CREATE INDEX IF NOT EXISTS idx_products_attributes_gin ON products USING GIN (attributes_json);
CREATE INDEX IF NOT EXISTS idx_listings_shipping_gin ON listings USING GIN (shipping_json);
CREATE INDEX IF NOT EXISTS idx_reviews_author_gin ON reviews USING GIN (author_json);
CREATE INDEX IF NOT EXISTS idx_jobs_payload_gin ON jobs USING GIN (payload_json);
CREATE INDEX IF NOT EXISTS idx_audits_diff_gin ON audits USING GIN (diff_json);

-- Índices para busca textual
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON listings USING GIN (title_raw gin_trgm_ops);

-- Índice para busca vetorial (pgvector)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);

-- Índices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS idx_listings_marketplace_status ON listings(marketplace_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_category_price ON listings(category_market, price_amount);
CREATE INDEX IF NOT EXISTS idx_products_brand_model ON products(brand, model) WHERE brand IS NOT NULL AND model IS NOT NULL;

-- Constraints adicionais
ALTER TABLE products ADD CONSTRAINT chk_products_gtin CHECK (gtin IS NULL OR length(gtin) >= 8);
ALTER TABLE listings ADD CONSTRAINT chk_listings_price CHECK (price_amount > 0);
ALTER TABLE reviews ADD CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5);

-- Dados iniciais
INSERT INTO marketplaces (name, code, site_id) VALUES 
    ('Mercado Livre Brasil', 'MLB', 'MLB'),
    ('Shopee Brasil', 'SHOPEE', NULL),
    ('Wish', 'WISH', NULL)
ON CONFLICT (code) DO NOTHING;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_marketplaces_updated_at BEFORE UPDATE ON marketplaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
