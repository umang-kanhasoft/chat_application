import './instrumentation';

import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import app, { options } from './app';
import { config } from './config/config';

let cachedServer: FastifyInstance | null = null;

const getServer = async () => {
    if (cachedServer) return cachedServer;

    const server = Fastify(options);
    await server.register(app);
    await server.ready();

    cachedServer = server;
    return server;
};

export default async function handler(req: any, res: any) {
    const server = await getServer();
    server.server.emit('request', req, res);
}

if (require.main === module) {
    getServer()
        .then((server) =>
            server.listen({
                port: config.port,
                host: '0.0.0.0',
            }),
        )
        .catch((err) => {
            console.error('Failed to start server:', err);
            process.exit(1);
        });
}
