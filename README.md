# 🛒 MercadoL Pithing

> **Plataforma de Descoberta e Análise de Produtos em Múltiplos Marketplaces**

Uma aplicação web moderna que permite descobrir, analisar e ranquear produtos de diversos marketplaces (Mercado Livre, Shopee, Wish) usando inteligência artificial e análise multimodal.

## 🚀 Características Principais

- **🔍 Busca Multimodal**: Busca por texto e imagem usando IA
- **📊 Sistema de Ranking**: Algoritmo inteligente baseado em demanda, qualidade, preço e reputação
- **🏪 Multi-Marketplace**: Integração com Mercado Livre, Shopee e Wish
- **📈 Observabilidade**: Logs estruturados, métricas Prometheus e tracing distribuído
- **🎨 Interface Moderna**: Frontend responsivo com Next.js 14
- **⚡ Performance**: Cache Redis, otimizações e ISR

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Services      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (CV Matching) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis        │    │   MinIO/S3       │
│   (pgvector)    │    │   (Cache/Queue) │    │  (Images)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **SWR** - Cache e sincronização de dados
- **Framer Motion** - Animações

### Backend
- **NestJS** - Framework Node.js
- **PostgreSQL** - Banco de dados principal
- **pgvector** - Extensão para embeddings
- **Redis** - Cache e filas
- **BullMQ** - Processamento de jobs

### IA/ML
- **CLIP** - Embeddings de imagem e texto
- **SBERT** - Embeddings de texto
- **Alibaba Cloud Image Search** - Busca por imagem

### Observabilidade
- **OpenTelemetry** - Tracing distribuído
- **Prometheus** - Métricas
- **Jaeger** - Visualização de traces
- **Pino** - Logging estruturado

### DevOps
- **Docker** - Containerização
- **Kubernetes** - Orquestração
- **Helm** - Gerenciamento de charts
- **GitHub Actions** - CI/CD

## 🚀 Quick Start

### 1. Clone o Repositório
```bash
git clone https://github.com/douglaslpo/mercadol-pithing.git
cd mercadol-pithing
```

### 2. Setup Automático
```bash
./setup.sh
```

### 3. Configurar Variáveis de Ambiente
```bash
cp env.example .env
# Edite o arquivo .env com suas credenciais
```

### 4. Iniciar Aplicação
```bash
# Subir infraestrutura
docker-compose -f docker-compose.dev.yml up -d

# Instalar dependências
pnpm install

# Iniciar aplicação
pnpm dev
```

### 5. Testar Aplicação
```bash
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

## 📚 Documentação

- **[Guia de Testes](TESTING_GUIDE.md)** - Como testar a aplicação
- **[Quick Start](QUICK_START.md)** - Execução rápida
- **[API Documentation](http://localhost:3001/api/docs)** - Documentação interativa

## 🧪 Testes

### Testes Automatizados
```bash
# Executar todos os testes
pnpm test

# Testes E2E
pnpm test:e2e

# Testes de carga
pnpm test:load
```

### Testes Manuais
```bash
# Health check
curl http://localhost:3001/api/health

# Busca no Mercado Livre
curl "http://localhost:3001/api/providers/meli/search?q=smartphone&limit=5"

# Busca por texto
curl -X POST http://localhost:3001/api/search/text \
  -H "Content-Type: application/json" \
  -d '{"q": "smartphone", "niche": "eletrônicos", "limit": 5}'
```

## 🔧 Configuração

### Variáveis de Ambiente Necessárias

```bash
# Banco de dados
DATABASE_URL=postgresql://postgres:password@localhost:5432/mercadol_pithing

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Mercado Livre
MELI_APP_ID=seu_app_id
MELI_CLIENT_SECRET=seu_client_secret

# Alibaba Cloud (opcional)
ALIBABA_ACCESS_KEY_ID=sua_chave
ALIBABA_ACCESS_KEY_SECRET=seu_secret
```

## 📊 Monitoramento

### Métricas Disponíveis
- `http_requests_total` - Total de requisições HTTP
- `http_request_duration_seconds` - Duração das requisições
- `app_info` - Informações da aplicação

### Logs Estruturados
- Contexto de requisição
- Timestamps precisos
- Metadados relevantes
- Integração com sistemas externos

### Tracing Distribuído
- Traces de requisições HTTP
- Spans de operações de banco
- Integração com APIs externas
- Visualização no Jaeger

## 🚀 Deploy

### Desenvolvimento
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Produção
```bash
# Usando Helm
helm install mercadol-pithing ./helm

# Usando Kubernetes
kubectl apply -f k8s/
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Douglas Lopes**
- GitHub: [@douglaslpo](https://github.com/douglaslpo)
- LinkedIn: [Douglas Lopes](https://linkedin.com/in/douglaslpo)

## 🙏 Agradecimentos

- Mercado Livre pela API pública
- Alibaba Cloud pelo Image Search
- Comunidade Open Source

---

**⭐ Se este projeto te ajudou, considere dar uma estrela!**