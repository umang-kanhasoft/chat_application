import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../../config/config';

export async function authMiddleware(request: FastifyRequest) {
    if (request.method === 'OPTIONS') return;

    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        throw request.server.httpErrors.unauthorized('Missing token');
    }

    const token = auth.slice('Bearer '.length);
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as { sub: string };
        (request as any).userId = decoded.sub;
    } catch {
        throw request.server.httpErrors.unauthorized('Invalid token');
    }
}

const plugin: FastifyPluginAsync = async () => {};
export default plugin;
