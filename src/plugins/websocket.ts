import fp from 'fastify-plugin';
import socketio from 'fastify-socket.io';
import { Server } from 'socket.io';
import socketManager from '../services/socket.manager';
import { AuthenticatedSocket } from '../types/socket.types';

declare module 'fastify' {
    interface FastifyInstance {
        io: Server;
    }
}

export default fp(async (fastify) => {
    await fastify.register(socketio, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:5175',
                'http://localhost:3000',
                'http://127.0.0.1:5173',
            ],
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
