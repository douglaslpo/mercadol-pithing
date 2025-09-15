#!/bin/bash

echo "🚀 Configurando MercadoL Pithing..."

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm não encontrado. Instalando..."
    npm install -g pnpm
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Dependências verificadas"

# Instalar dependências
echo "📦 Instalando dependências..."
pnpm install

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp env.example .env
    echo "⚠️  Configure as variáveis de ambiente no arquivo .env"
fi

# Subir serviços de infraestrutura
echo "🐳 Subindo serviços de infraestrutura..."
docker-compose up -d postgres redis

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Executar migrações do banco
echo "🗄️  Executando migrações do banco..."
pnpm db:migrate

# Executar seed do banco
echo "🌱 Executando seed do banco..."
pnpm db:seed

echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente no arquivo .env"
echo "2. Execute 'pnpm dev' para iniciar a aplicação"
echo "3. Acesse http://localhost:3000 para o frontend"
echo "4. Acesse http://localhost:3001/api/docs para a documentação da API"
echo "5. Acesse http://localhost:3001/api/health para verificar a saúde da API"
echo "6. Acesse http://localhost:3001/api/metrics para ver as métricas"
