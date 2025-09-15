import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

export function initializeOpenTelemetry() {
  const serviceName = process.env.OTEL_SERVICE_NAME || 'mercadol-pithing-api';
  const environment = process.env.NODE_ENV || 'development';
  const jaegerHost = process.env.JAEGER_AGENT_HOST || 'localhost';
  const jaegerPort = parseInt(process.env.JAEGER_AGENT_PORT || '6832');

  // Create exporters
  const exporters = [];
  
  if (environment === 'development') {
    exporters.push(new ConsoleSpanExporter());
  }
  
  if (jaegerHost && jaegerPort) {
    exporters.push(new JaegerExporter({
      host: jaegerHost,
      port: jaegerPort,
    }));
  }

  // Create span processors
  const spanProcessors = exporters.map(exporter => 
    new BatchSpanProcessor(exporter)
  );

  // Initialize SDK
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
    }),
    spanProcessor: spanProcessors[0], // Use first processor for now
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable file system instrumentation
        },
        '@opentelemetry/instrumentation-net': {
          enabled: false, // Disable network instrumentation
        },
      }),
    ],
  });

  // Start SDK
  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('OpenTelemetry SDK shut down successfully'))
      .catch((error) => console.error('Error shutting down OpenTelemetry SDK:', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}
