import websocket from '@fastify/websocket';
import fp from 'fastify-plugin';
import socketManager from '../services/socket.manager';

export default fp(async (fastify) => {
    fastify.register(websocket, {
        options: {
            maxPayload: 1048576, // 1MB
            clientTracking: true,
        },
    });

    // Start heartbeat mechanism
    socketManager.startHeartbeat();

    fastify.log.info('WebSocket plugin registered with heartbeat');
});
