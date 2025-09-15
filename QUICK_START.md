# 🚀 Quick Start - MercadoL Pithing

## ⚡ Execução Rápida

### 1. **Setup Automático**
```bash
# Executar setup completo
./setup.sh
```

### 2. **Configurar Variáveis de Ambiente**
```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar com suas credenciais
nano .env
```

**Variáveis importantes para configurar:**
```bash
# Mercado Livre (obtenha em https://developers.mercadolibre.com/)
MELI_APP_ID=seu_app_id
MELI_CLIENT_SECRET=seu_client_secret

# Alibaba Cloud (opcional)
ALIBABA_ACCESS_KEY_ID=sua_chave
ALIBABA_ACCESS_KEY_SECRET=seu_secret
```

### 3. **Iniciar Aplicação**
```bash
# Subir infraestrutura
docker-compose -f docker-compose.dev.yml up -d

# Instalar dependências
pnpm install

# Iniciar aplicação
pnpm dev
```

### 4. **Testar Aplicação**
```bash
# Executar testes automatizados
./test-api.sh
```

## 🌐 URLs Importantes

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface principal |
| **API** | http://localhost:3001/api | Backend API |
| **Documentação** | http://localhost:3001/api/docs | Swagger UI |
| **Health Check** | http://localhost:3001/api/health | Status da API |
| **Métricas** | http://localhost:3001/api/metrics | Métricas Prometheus |
| **Jaeger** | http://localhost:16686 | Tracing distribuído |
| **MinIO** | http://localhost:9001 | Armazenamento de imagens |

## 🧪 Testes Manuais

### **Health Check**
```bash
curl http://localhost:3001/api/health
```

### **Busca no Mercado Livre**
```bash
curl "http://localhost:3001/api/providers/meli/search?q=smartphone&limit=5"
```

### **Busca por Texto**
```bash
curl -X POST http://localhost:3001/api/search/text \
  -H "Content-Type: application/json" \
  -d '{"q": "smartphone", "niche": "eletrônicos", "limit": 5}'
```

### **Rankings**
```bash
curl http://localhost:3001/api/rankings/stats
```

### **Métricas**
```bash
curl http://localhost:3001/api/metrics
```

## 🔧 Troubleshooting

### **Problema: Porta em uso**
```bash
# Verificar portas
lsof -i :3000
lsof -i :3001

# Matar processo se necessário
kill -9 <PID>
```

### **Problema: Banco não conecta**
```bash
# Verificar PostgreSQL
docker ps | grep postgres
docker-compose -f docker-compose.dev.yml restart postgres
```

### **Problema: Redis não conecta**
```bash
# Verificar Redis
docker ps | grep redis
docker-compose -f docker-compose.dev.yml restart redis
```

### **Problema: Dependências**
```bash
# Limpar e reinstalar
pnpm clean
pnpm install
```

## 📊 Monitoramento

### **Logs da Aplicação**
```bash
# Ver logs em tempo real
docker-compose -f docker-compose.dev.yml logs -f api
```

### **Métricas Prometheus**
- Acesse: http://localhost:3001/api/metrics
- Métricas disponíveis:
  - `http_requests_total` - Total de requisições HTTP
  - `http_request_duration_seconds` - Duração das requisições
  - `app_info` - Informações da aplicação

### **Tracing Jaeger**
- Acesse: http://localhost:16686
- Visualize traces das requisições
- Analise performance e dependências

## 🎯 Próximos Passos

1. **Configurar APIs Externas**
   - Obter credenciais do Mercado Livre
   - Configurar Alibaba Cloud Image Search
   - Testar integrações

2. **Testar Funcionalidades**
   - Busca por texto
   - Busca por imagem
   - Sistema de ranking
   - Observabilidade

3. **Desenvolvimento**
   - Implementar novas funcionalidades
   - Adicionar testes unitários
   - Melhorar performance

## 📝 Checklist de Verificação

- [ ] Infraestrutura rodando (PostgreSQL, Redis, MinIO)
- [ ] API respondendo em http://localhost:3001
- [ ] Frontend rodando em http://localhost:3000
- [ ] Health check passando
- [ ] Métricas sendo coletadas
- [ ] Documentação acessível
- [ ] Logs sendo gerados
- [ ] Tracing funcionando (se Jaeger estiver rodando)

---

**💡 Dica**: Execute `./test-api.sh` para verificar se tudo está funcionando corretamente!
