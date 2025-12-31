import fp from 'fastify-plugin';
import socketio from 'fastify-socket.io';
import { Server } from 'socket.io';
import { config } from '../config/config';
import socketManager from '../services/socket.manager';
import { AuthenticatedSocket } from '../types/socket.types';

declare module 'fastify' {
    interface FastifyInstance {
        io: Server;
    }
}

export default fp(async (fastify) => {
    const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, '');

    const raw = config.cors.corsOrigin;
    const allowList = new Set(raw.split(',').map(normalizeOrigin).filter(Boolean));

    await fastify.register(socketio, {
        cors: {
            origin: (origin, cb) => {
                if (!origin) return cb(null, true);

                const normalized = normalizeOrigin(origin);
                const allowed = allowList.size === 0 ? true : allowList.has(normalized);
                if (!allowed) {
                    fastify.log.warn(
                        { origin: normalized, allowList: Array.from(allowList) },
                        'Socket.IO CORS blocked origin',
                    );
                }
                return cb(null, allowed);
            },
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['*'],
        },
        transports: ['websocket', 'polling'],
        maxHttpBufferSize: 500 * 1024 * 1024,
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 30000,
        allowEIO3: true,
        allowUpgrades: true,
        perMessageDeflate: false,
        httpCompression: false,
        connectTimeout: 45000,
    });

    fastify.ready((err) => {
        if (err) {
            fastify.log.error(err, 'Socket.io initialization error');
            throw err;
        }

        const handleConn = (socket: any) => {
            fastify.log.info(`Socket.io client connected: ${socket.id} (ns: ${socket.nsp.name})`);
            socketManager.handleConnection(socket as AuthenticatedSocket, fastify.io);
        };

        fastify.io.on('connection', handleConn);
        fastify.io.of('/chat').on('connection', handleConn);
    });

    fastify.log.info('Socket.io plugin registered');
});
