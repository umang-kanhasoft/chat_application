import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../constants/config';
import { SocketEventType, ConnectionStatus, type SocketMessage } from '../types/chat.types';

type MessageHandler = (message: SocketMessage) => void;
type ConnectionStatusHandler = (status: ConnectionStatus) => void;

class SocketService {
    private socket: Socket | null = null;
    private messageHandlers: Map<SocketEventType, MessageHandler[]> = new Map();
    private connectionStatusHandlers: ConnectionStatusHandler[] = [];
    private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    private connectingPromise: Promise<void> | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isConnecting = false;
    private lastConnectAttempt = 0;
    private minConnectInterval = 1000; // Minimum 1 second between connection attempts

    constructor() {
        // Initialize message handlers map
        Object.values(SocketEventType).forEach((type) => {
            this.messageHandlers.set(type as SocketEventType, []);
        });
    }

    /**
     * Calculate exponential backoff delay
     */
    private getReconnectDelay(): number {
        const baseDelay = 1000;
        const maxDelay = 10000;
        const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts), maxDelay);
        return delay;
    }

    /**
     * Setup socket event listeners
     */
    private setupSocketListeners(resolve: () => void, reject: (error: Error) => void): void {
        if (!this.socket) return;

        // Remove all existing listeners to prevent duplicates
        this.socket.off('connect');
        this.socket.off('disconnect');
        this.socket.off('connect_error');
        this.socket.off('reconnect_attempt');
        this.socket.off('reconnect');
        this.socket.off('reconnect_failed');
        this.socket.off('message');

        this.socket.on('connect', () => {
            console.log('Socket.io connected');
            this.reconnectAttempts = 0;
            this.isConnecting = false;
            this.setConnectionStatus(ConnectionStatus.CONNECTED);
            this.connectingPromise = null;
            resolve();
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`Socket.io disconnected: ${reason}`);
            this.isConnecting = false;
            this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
            this.connectingPromise = null;

            // Only auto-reconnect for certain disconnect reasons
            if (reason === 'io server disconnect') {
                // Server forcefully disconnected, don't auto-reconnect
                this.reconnectAttempts = this.maxReconnectAttempts;
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket.io connection error:', error);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.isConnecting = false;
                this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
                this.connectingPromise = null;
                reject(error as Error);
            } else {
                this.setConnectionStatus(ConnectionStatus.RECONNECTING);
            }
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Reconnection attempt ${attemptNumber}`);
            this.setConnectionStatus(ConnectionStatus.RECONNECTING);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`Reconnected after ${attemptNumber} attempts`);
            this.reconnectAttempts = 0;
        });

        this.socket.on('reconnect_failed', () => {
            console.error('Reconnection failed after all attempts');
            this.isConnecting = false;
            this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
            this.connectingPromise = null;
        });

        this.socket.on('message', (message: SocketMessage) => {
            this.handleMessage(message);
        });
    }

    /**
     * Connect to Socket.io server with throttling and proper state management
     */
    connect(): Promise<void> {
        // Already connected
        if (this.socket?.connected) {
            return Promise.resolve();
        }

        // Already connecting
        if (this.isConnecting && this.connectingPromise) {
            return this.connectingPromise;
        }

        // Throttle connection attempts
        const now = Date.now();
        if (now - this.lastConnectAttempt < this.minConnectInterval) {
            console.log('Connection attempt throttled');
            return Promise.reject(new Error('Connection attempt too soon'));
        }
        this.lastConnectAttempt = now;

        this.isConnecting = true;
        this.connectingPromise = new Promise((resolve, reject) => {
            this.setConnectionStatus(ConnectionStatus.CONNECTING);

            // Create new socket if it doesn't exist
            if (!this.socket) {
                this.socket = io(WS_URL, {
                    reconnection: true,
                    reconnectionAttempts: this.maxReconnectAttempts,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 10000,
                    timeout: 120000,
                    autoConnect: false,
                    transports: ['websocket', 'polling'],
                    upgrade: true,
                    rememberUpgrade: true,
                    forceNew: false,
                    multiplex: true,
                });

                this.setupSocketListeners(resolve, reject);
            } else {
                // Socket exists but not connected, setup listeners again
                this.setupSocketListeners(resolve, reject);
            }

            // Connect with exponential backoff
            const delay = this.reconnectAttempts > 0 ? this.getReconnectDelay() : 0;

            setTimeout(() => {
                if (this.socket && !this.socket.connected) {
                    this.socket.connect();
                }
            }, delay);
        });

        return this.connectingPromise;
    }

    /**
     * Disconnect from Socket.io server with proper cleanup
     */
    disconnect(): void {
        if (this.socket) {
            // Remove all listeners before disconnecting
            this.socket.off('connect');
            this.socket.off('disconnect');
            this.socket.off('connect_error');
            this.socket.off('reconnect_attempt');
            this.socket.off('reconnect');
            this.socket.off('reconnect_failed');
            this.socket.off('message');

            this.socket.disconnect();
            this.socket = null;
        }

        this.isConnecting = false;
        this.connectingPromise = null;
        this.reconnectAttempts = 0;
        this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }

    /**
     * Send a message through Socket.io
     */
    send(message: SocketMessage): boolean {
        if (this.socket?.connected) {
            this.socket.emit('message', message);
            return true;
        }
        return false;
    }

    /**
     * Register a message handler for a specific event type
     */
    on(type: SocketEventType, handler: MessageHandler): () => void {
        const handlers = this.messageHandlers.get(type) || [];
        handlers.push(handler);
        this.messageHandlers.set(type, handlers);

        // Return unsubscribe function
        return () => {
            const currentHandlers = this.messageHandlers.get(type) || [];
            const index = currentHandlers.indexOf(handler);
            if (index > -1) {
                currentHandlers.splice(index, 1);
            }
        };
    }

    /**
     * Register a connection status handler
     */
    onConnectionStatusChange(handler: ConnectionStatusHandler): () => void {
        this.connectionStatusHandlers.push(handler);

        // Return unsubscribe function
        return () => {
            const index = this.connectionStatusHandlers.indexOf(handler);
            if (index > -1) {
                this.connectionStatusHandlers.splice(index, 1);
            }
        };
    }

    /**
     * Get current connection status
     */
    getConnectionStatus(): ConnectionStatus {
        return this.connectionStatus;
    }

    /**
     * Check if socket is connected
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Authenticate user
     */
    authenticate(userId: string): void {
        this.send({
            type: SocketEventType.AUTH,
            payload: { userId },
        });
    }

    /**
     * Handle incoming Socket.io message
     */
    private handleMessage(message: SocketMessage): void {
        const handlers = this.messageHandlers.get(message.type) || [];
        handlers.forEach((handler) => {
            try {
                handler(message);
            } catch (error) {
                console.error(`Error in message handler for ${message.type}:`, error);
            }
        });
    }

    /**
     * Set connection status and notify handlers
     */
    private setConnectionStatus(status: ConnectionStatus): void {
        this.connectionStatus = status;
        this.connectionStatusHandlers.forEach((handler) => {
            try {
                handler(status);
            } catch (error) {
                console.error('Error in connection status handler:', error);
            }
        });
    }
}

// Export singleton instance as wsService to maintain compatibility with existing code
export const wsService = new SocketService();
