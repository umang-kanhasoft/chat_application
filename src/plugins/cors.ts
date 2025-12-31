import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import { config } from '../config/config';

export default fp(async (fastify) => {
    const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, '');

    const raw = config.cors.corsOrigin;
    const allowList = new Set(raw.split(',').map(normalizeOrigin).filter(Boolean));

    fastify.register(cors, {
        origin: (origin, cb) => {
            // Non-browser clients (curl/postman) may send no Origin.
            if (!origin) return cb(null, true);

            const normalized = normalizeOrigin(origin);
            const allowed = allowList.size === 0 ? true : allowList.has(normalized);
            if (!allowed) {
                fastify.log.warn(
                    { origin: normalized, allowList: Array.from(allowList) },
                    'CORS blocked origin',
                );
            }
            return cb(null, allowed);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });
});
