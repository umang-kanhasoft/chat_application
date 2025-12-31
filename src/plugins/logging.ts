import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const loggingPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('onRequest', async (request) => {
        const log = request.log.child({
            reqId: request.id,
            route: request.routeOptions?.url,
            method: request.method,
        });

        log.info(
            {
                req: {
                    method: request.method,
                    url: request.url,
                    headers: request.headers,
                    remoteAddress: request.ip,
                },
            },
            'request.start',
        );
    });

    fastify.addHook('onResponse', async (request, reply) => {
        const responseTimeMs = reply.elapsedTime;
        const level = reply.statusCode >= 500 ? 'error' : reply.statusCode >= 400 ? 'warn' : 'info';

        request.log
            .child({ reqId: request.id, route: request.routeOptions?.url, method: request.method })
            [level](
                {
                    res: {
                        statusCode: reply.statusCode,
                    },
                    responseTimeMs,
                },
                'request.complete',
            );
    });

    fastify.addHook('onError', async (request, reply, error) => {
        request.log
            .child({ reqId: request.id, route: request.routeOptions?.url, method: request.method })
            .error(
                {
                    err: error,
                    res: {
                        statusCode: reply.statusCode,
                    },
                },
                'request.error',
            );
    });

    fastify.log.info('Logging plugin registered');
};

export default fp(loggingPlugin);
