import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
    await fastify.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        skipOnError: true,
        keyGenerator: (req) => {
            const xff = req.headers['x-forwarded-for'];
            if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0].trim();
            return req.ip;
        },
        errorResponseBuilder: (req, context) => ({
            statusCode: 429,
            code: 'RATE_LIMIT_EXCEEDED',
            error: 'Too many requests',
            retryAfter: context.ttl,
        }),
    });
});
