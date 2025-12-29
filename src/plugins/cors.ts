import fp from 'fastify-plugin';
import cors from '@fastify/cors';

export default fp(async (fastify) => {
    fastify.register(cors, {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });
});
