#!/bin/bash

# Script de setup para MercadoL Pithing
# Este script configura o ambiente de desenvolvimento

set -e

echo "🚀 Configurando MercadoL Pithing..."

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm não encontrado. Instalando..."
    npm install -g pnpm
fi

# Verificar se Docker está rodando
if ! docker info &> /dev/null; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker e tente novamente."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
pnpm install

# Copiar arquivo de ambiente se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp env.example .env
    echo "⚠️  Por favor, edite o arquivo .env com suas credenciais antes de continuar."
fi

# Subir serviços Docker
echo "🐳 Subindo serviços Docker..."
docker-compose up -d

# Aguardar serviços ficarem healthy
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Verificar status dos serviços
echo "🔍 Verificando status dos serviços..."
docker-compose ps

# Verificar se PostgreSQL está pronto
echo "🗄️  Verificando conexão com PostgreSQL..."
until docker-compose exec -T db pg_isready -U postgres; do
    echo "⏳ Aguardando PostgreSQL..."
    sleep 2
done

# Verificar se Redis está pronto
echo "🔴 Verificando conexão com Redis..."
until docker-compose exec -T redis redis-cli ping; do
    echo "⏳ Aguardando Redis..."
    sleep 2
done

echo "✅ Setup concluído!"
echo ""
echo "🎯 Próximos passos:"
echo "1. Edite o arquivo .env com suas credenciais de API"
echo "2. Execute: pnpm --filter @apps/api dev"
echo "3. Execute: pnpm --filter @apps/web dev"
echo "4. Execute: pnpm --filter @services/cv-matching dev"
echo ""
echo "🌐 URLs:"
echo "- Frontend: http://localhost:3000"
echo "- API: http://localhost:3001"
echo "- Documentação: http://localhost:3001/api/docs"
echo "- Embeddings: http://localhost:3002/health"
echo ""
echo "📚 Consulte o README.md para mais informações."
