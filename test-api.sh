#!/bin/bash

echo "🧪 Testando APIs do MercadoL Pithing..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -e "${BLUE}Testando: ${description}${NC}"
    echo "URL: $url"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url")
    status_code=${response: -3}
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ Sucesso (Status: $status_code)${NC}"
        if [ -s /tmp/response.json ]; then
            echo "Resposta:"
            cat /tmp/response.json | jq . 2>/dev/null || cat /tmp/response.json
        fi
    else
        echo -e "${RED}❌ Falha (Status: $status_code, Esperado: $expected_status)${NC}"
        if [ -s /tmp/response.json ]; then
            echo "Erro:"
            cat /tmp/response.json
        fi
    fi
    echo ""
}

# Verificar se a API está rodando
echo -e "${YELLOW}Verificando se a API está rodando...${NC}"
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${RED}❌ API não está rodando em http://localhost:3001${NC}"
    echo "Execute 'pnpm dev' primeiro"
    exit 1
fi

echo -e "${GREEN}✅ API está rodando${NC}"
echo ""

# Testes de Health Check
echo -e "${YELLOW}=== TESTES DE HEALTH CHECK ===${NC}"
test_endpoint "http://localhost:3001/api/health" "Health Check Geral"
test_endpoint "http://localhost:3001/api/health/ready" "Readiness Check"
test_endpoint "http://localhost:3001/api/health/live" "Liveness Check"

# Testes de Métricas
echo -e "${YELLOW}=== TESTES DE MÉTRICAS ===${NC}"
test_endpoint "http://localhost:3001/api/metrics" "Métricas Prometheus"

# Testes de Providers
echo -e "${YELLOW}=== TESTES DE PROVIDERS ===${NC}"
test_endpoint "http://localhost:3001/api/providers/health" "Health Check de Todos os Providers"
test_endpoint "http://localhost:3001/api/providers/meli/health" "Health Check Mercado Livre"
test_endpoint "http://localhost:3001/api/providers/alibaba/health" "Health Check Alibaba"
test_endpoint "http://localhost:3001/api/providers/shopee/health" "Health Check Shopee"
test_endpoint "http://localhost:3001/api/providers/wish/health" "Health Check Wish"

# Testes de Busca MELI
echo -e "${YELLOW}=== TESTES DE BUSCA MERCADO LIVRE ===${NC}"
test_endpoint "http://localhost:3001/api/providers/meli/search?q=smartphone&limit=5" "Busca Pública MELI"
test_endpoint "http://localhost:3001/api/providers/meli/trending" "Termos em Alta MELI"

# Testes de Rankings
echo -e "${YELLOW}=== TESTES DE RANKINGS ===${NC}"
test_endpoint "http://localhost:3001/api/rankings/stats" "Estatísticas de Ranking"
test_endpoint "http://localhost:3001/api/rankings/explanation" "Explicação de Ranking"

# Testes de Busca por Texto
echo -e "${YELLOW}=== TESTES DE BUSCA POR TEXTO ===${NC}"
echo -e "${BLUE}Testando: Busca por Texto${NC}"
echo "URL: http://localhost:3001/api/search/text"
echo "Payload: {\"q\": \"smartphone\", \"niche\": \"eletrônicos\", \"limit\": 5}"

response=$(curl -s -w "%{http_code}" -o /tmp/response.json \
  -X POST http://localhost:3001/api/search/text \
  -H "Content-Type: application/json" \
  -d '{"q": "smartphone", "niche": "eletrônicos", "limit": 5}')

status_code=${response: -3}

if [ "$status_code" -eq "200" ]; then
    echo -e "${GREEN}✅ Sucesso (Status: $status_code)${NC}"
    echo "Resposta:"
    cat /tmp/response.json | jq . 2>/dev/null || cat /tmp/response.json
else
    echo -e "${RED}❌ Falha (Status: $status_code)${NC}"
    if [ -s /tmp/response.json ]; then
        echo "Erro:"
        cat /tmp/response.json
    fi
fi
echo ""

# Testes de Documentação
echo -e "${YELLOW}=== TESTES DE DOCUMENTAÇÃO ===${NC}"
test_endpoint "http://localhost:3001/api/docs" "Documentação Swagger"

# Resumo dos Testes
echo -e "${YELLOW}=== RESUMO DOS TESTES ===${NC}"
echo "✅ Testes concluídos!"
echo ""
echo "📋 URLs importantes:"
echo "• API: http://localhost:3001/api"
echo "• Documentação: http://localhost:3001/api/docs"
echo "• Health Check: http://localhost:3001/api/health"
echo "• Métricas: http://localhost:3001/api/metrics"
echo "• Providers: http://localhost:3001/api/providers"
echo ""
echo "🔧 Para testar manualmente:"
echo "• curl http://localhost:3001/api/health"
echo "• curl 'http://localhost:3001/api/providers/meli/search?q=smartphone&limit=5'"
echo "• curl -X POST http://localhost:3001/api/search/text -H 'Content-Type: application/json' -d '{\"q\": \"smartphone\", \"limit\": 5}'"
