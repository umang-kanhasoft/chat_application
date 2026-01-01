import './instrumentation';

import Fastify from 'fastify';
import app, { options } from './app';
import { config } from './config/config';

const start = async () => {
    const server = Fastify(options);

    await server.register(app);

    await server.listen({
        port: config.port,
        host: '0.0.0.0',
    });
};

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
