# 🧪 Guia de Testes - MercadoL Pithing

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker e Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

## 🚀 Configuração Inicial

### 1. Executar Setup Automático
```bash
./setup.sh
```

### 2. Configurar Variáveis de Ambiente
Edite o arquivo `.env` com suas credenciais:

```bash
# APIs Externas (obtenha suas credenciais)
MELI_APP_ID=seu_app_id_do_mercadolivre
MELI_CLIENT_SECRET=seu_client_secret_do_mercadolivre
ALIBABA_ACCESS_KEY_ID=sua_chave_alibaba
ALIBABA_ACCESS_KEY_SECRET=seu_secret_alibaba
```

### 3. Iniciar Aplicação
```bash
pnpm dev
```

## 🧪 Testes por Componente

### **1. Teste de Infraestrutura**

#### PostgreSQL
```bash
# Conectar ao banco
docker exec -it mercadol-pithing-postgres psql -U postgres -d mercadol_pithing

# Verificar tabelas
\dt

# Verificar dados
SELECT * FROM products LIMIT 5;
```

#### Redis
```bash
# Conectar ao Redis
docker exec -it mercadol-pithing-redis redis-cli

# Testar comandos básicos
SET test "Hello Redis"
GET test
```

### **2. Teste de APIs**

#### Health Check
```bash
# Verificar saúde geral
curl http://localhost:3001/api/health

# Verificar readiness
curl http://localhost:3001/api/health/ready

# Verificar liveness
curl http://localhost:3001/api/health/live
```

#### Métricas
```bash
# Ver métricas Prometheus
curl http://localhost:3001/api/metrics
```

#### Documentação
```bash
# Acessar Swagger UI
open http://localhost:3001/api/docs
```

### **3. Teste de Endpoints Principais**

#### Busca por Texto
```bash
curl -X POST http://localhost:3001/api/search/text \
  -H "Content-Type: application/json" \
  -d '{
    "q": "smartphone",
    "niche": "eletrônicos",
    "limit": 10,
    "page": 1
  }'
```

#### Busca por Imagem
```bash
curl -X POST http://localhost:3001/api/search/image \
  -F "image=@/path/to/your/image.jpg" \
  -F "limit=10"
```

#### Rankings
```bash
# Estatísticas de ranking
curl http://localhost:3001/api/rankings/stats

# Explicação do ranking
curl http://localhost:3001/api/rankings/explanation
```

### **4. Teste de Integrações Externas**

#### Mercado Livre
```bash
# Testar busca pública
curl "http://localhost:3001/api/providers/meli/search?q=smartphone&limit=5"

# Health check MELI
curl http://localhost:3001/api/providers/meli/health
```

#### Alibaba Image Search
```bash
# Health check Alibaba
curl http://localhost:3001/api/providers/alibaba/health
```

### **5. Teste do Frontend**

#### Página Principal
- Acesse: http://localhost:3000
- Teste busca por texto
- Teste busca por imagem
- Verifique responsividade

#### Páginas Específicas
- `/search/text` - Busca por texto
- `/search/image` - Busca por imagem
- `/rankings` - Rankings e estatísticas

### **6. Teste de Observabilidade**

#### Logs
```bash
# Ver logs da aplicação
docker logs mercadol-pithing-api

# Logs estruturados (se configurado)
tail -f logs/app.log
```

#### Métricas
- Acesse: http://localhost:3001/api/metrics
- Verifique métricas HTTP
- Verifique métricas de sistema

#### Tracing (se Jaeger estiver rodando)
- Acesse: http://localhost:16686
- Verifique traces das requisições

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

#### 2. Erro de Conexão com Redis
```bash
# Verificar se Redis está rodando
docker ps | grep redis

# Reiniciar Redis
docker-compose restart redis
```

#### 3. Erro de Dependências
```bash
# Limpar cache e reinstalar
pnpm clean
pnpm install
```

#### 4. Erro de Porta em Uso
```bash
# Verificar portas em uso
lsof -i :3000
lsof -i :3001

# Matar processos se necessário
kill -9 <PID>
```

## 📊 Testes de Performance

### Load Testing com Artillery
```bash
# Instalar Artillery
npm install -g artillery

# Executar teste de carga
artillery quick --count 10 --num 5 http://localhost:3001/api/health
```

### Teste de Stress
```bash
# Teste com múltiplas requisições simultâneas
for i in {1..10}; do
  curl http://localhost:3001/api/health &
done
wait
```

## 🐛 Debugging

### Logs Detalhados
```bash
# Ativar logs debug
export LOG_LEVEL=debug
pnpm dev
```

### Inspeção de Containers
```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Entrar no container da API
docker exec -it mercadol-pithing-api sh
```

## ✅ Checklist de Testes

- [ ] Infraestrutura (PostgreSQL, Redis)
- [ ] Health checks
- [ ] Métricas Prometheus
- [ ] Documentação Swagger
- [ ] Busca por texto
- [ ] Busca por imagem
- [ ] Rankings
- [ ] Integrações externas
- [ ] Frontend responsivo
- [ ] Observabilidade (logs, métricas, traces)
- [ ] Performance básica

## 📝 Relatório de Testes

Após executar os testes, documente:

1. **Status dos Serviços**: Quais estão funcionando
2. **Problemas Encontrados**: Erros e soluções
3. **Performance**: Tempo de resposta médio
4. **Integrações**: Status das APIs externas
5. **Observabilidade**: Funcionamento dos logs/métricas/traces

---

**💡 Dica**: Execute os testes em ordem e documente cada passo para facilitar o debugging.
