import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Sentry } from '../config/sentry';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { metrics } from '@opentelemetry/api';

const monitoringPlugin: FastifyPluginAsync = async (fastify) => {
    const tracer = trace.getTracer('freelance-platform');
    const meter = metrics.getMeter('freelance-platform');
    const requestDurationMs = meter.createHistogram('http.server.duration', {
        description: 'Incoming HTTP request duration',
        unit: 'ms',
    });

    fastify.addHook('onRequest', async (request, reply) => {
        (request as any).requestStart = Date.now();

        const span = tracer.startSpan(`${request.method} ${request.url}`, {
            attributes: {
                'http.method': request.method,
                'http.url': request.url,
                'http.route': request.routeOptions.url || request.url,
            },
        });

        (request as any).span = span;
        (request as any).traceContext = trace.setSpan(context.active(), span);

        // Ensure child operations during request lifecycle attach to this span
        context.with((request as any).traceContext, () => {
            // no-op, just binding context for subsequent hooks
        });
    });

    fastify.addHook('onResponse', async (request, reply) => {
        const span = (request as any).span;
        const start = (request as any).requestStart;

        if (typeof start === 'number') {
            requestDurationMs.record(Date.now() - start, {
                'http.method': request.method,
                'http.route': request.routeOptions.url || request.url,
                'http.status_code': reply.statusCode,
            });
        }

        if (span) {
            span.setAttribute('http.status_code', reply.statusCode);
            span.setStatus({
                code: reply.statusCode >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
            });
            span.end();
        }
    });

    fastify.addHook('onError', async (request, reply, error) => {
        const span = (request as any).span;
        if (span) {
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        }

        const safeHeaders: Record<string, any> = { ...request.headers };
        delete safeHeaders.authorization;
        delete safeHeaders.cookie;

        const activeSpan = span || trace.getSpan(context.active());
        const spanContext = activeSpan?.spanContext();

        Sentry.captureException(error, {
            contexts: {
                request: {
                    method: request.method,
                    url: request.url,
                    headers: safeHeaders,
                },
            },
            user: {
                id: (request as any).user?.id,
            },
            tags: spanContext
                ? {
                      trace_id: spanContext.traceId,
                      span_id: spanContext.spanId,
                  }
                : undefined,
        });
    });

    fastify.log.info('Monitoring plugin registered');
};

export default fp(monitoringPlugin);
