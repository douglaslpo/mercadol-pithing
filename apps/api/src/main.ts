import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { initializeOpenTelemetry } from './config/otel.config';

async function bootstrap() {
  // Initialize OpenTelemetry first
  initializeOpenTelemetry();

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('NEXT_PUBLIC_API_URL') || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('MercadoL Pithing API')
    .setDescription('API para descoberta e análise de produtos em múltiplos marketplaces')
    .setVersion('1.0')
    .addTag('search', 'Busca de produtos')
    .addTag('rankings', 'Rankings e análises')
    .addTag('products', 'Gestão de produtos')
    .addTag('merchants', 'Gestão de vendedores')
    .addTag('validation', 'Validação de produtos')
    .addTag('health', 'Health checks')
    .addTag('metrics', 'Métricas Prometheus')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('API_PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 API rodando em http://localhost:${port}`);
  console.log(`📚 Documentação disponível em http://localhost:${port}/api/docs`);
  console.log(`📊 Métricas disponíveis em http://localhost:${port}/api/metrics`);
  console.log(`🏥 Health check disponível em http://localhost:${port}/api/health`);
}

bootstrap();
