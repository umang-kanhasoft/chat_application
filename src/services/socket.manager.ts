import { config } from '../config/config';
import { AuthenticatedSocket, SocketMessage } from '../types/socket.types';

class SocketManager {
    private connections: Map<string, AuthenticatedSocket> = new Map();

    addConnection(userId: string, socket: AuthenticatedSocket): void {
        socket.userId = userId;
        socket.isAlive = true;
        this.connections.set(userId, socket);
    }

    removeConnection(userId: string): void {
        this.connections.delete(userId);
    }

    isUserOnline(userId: string): boolean {
        return this.connections.has(userId);
    }

    getOnlineUsers(): string[] {
        return Array.from(this.connections.keys());
    }

    sendToUser(userId: string, message: SocketMessage): boolean {
        const socket = this.connections.get(userId);
        if (socket && socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify({ ...message, timestamp: new Date() }));
            return true;
        }
        return false;
    }

    broadcast(message: SocketMessage, excludeUserId?: string): void {
        this.connections.forEach((socket, userId) => {
            if (userId !== excludeUserId && socket.readyState === socket.OPEN) {
                socket.send(JSON.stringify({ ...message, timestamp: new Date() }));
            }
        });
    }

    startHeartbeat(): void {
        setInterval(() => {
            this.connections.forEach((socket, userId) => {
                if (socket.isAlive === false) {
                    this.removeConnection(userId);
                    return socket.terminate();
                }
                socket.isAlive = false;
                socket.ping();
            });
        }, config.socket.heartbeatInterval);
    }

    handlePong(userId: string): void {
        const socket = this.connections.get(userId);
        if (socket) socket.isAlive = true;
    }
}

export default new SocketManager();
