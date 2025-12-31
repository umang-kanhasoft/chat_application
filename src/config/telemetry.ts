import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { config } from './config';
import { getLogger } from './logger';

export function initTelemetry() {
    const log = getLogger('telemetry');
    const serviceName = config.otel.serviceName;
    const serviceVersion = config.otel.serviceVersion;

    const resource = defaultResource().merge(
        resourceFromAttributes({
            [ATTR_SERVICE_NAME]: serviceName,
            [ATTR_SERVICE_VERSION]: serviceVersion,
            environment: config.environment,
        }),
    );

    const otlpEndpoint = config.otel.endpoint;
    const traceExporter = new OTLPTraceExporter({
        url: `${otlpEndpoint.replace(/\/$/, '')}/v1/traces`,
    });

    const metricExporter = new OTLPMetricExporter({
        url: `${otlpEndpoint.replace(/\/$/, '')}/v1/metrics`,
    });

    const metricReader = new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: config.otel.metricExportInterval,
    });

    const sdk = new NodeSDK({
        resource,
        traceExporter,
        metricReader,
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs': { enabled: false },
                '@opentelemetry/instrumentation-http': {
                    ignoreIncomingRequestHook: (req) => {
                        return req.url?.includes('/health') || false;
                    },
                },
                '@opentelemetry/instrumentation-fastify': { enabled: true },
                '@opentelemetry/instrumentation-pg': { enabled: true },
                '@opentelemetry/instrumentation-graphql': { enabled: true },
            }),
        ],
    });

    sdk.start();

    process.on('SIGTERM', () => {
        sdk.shutdown().catch((error) => {
            log.error({ err: error }, 'Error terminating telemetry');
        });
    });

    return sdk;
}
