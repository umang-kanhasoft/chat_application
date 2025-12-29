import { Server } from 'socket.io';
import { AuthenticatedSocket, SocketMessage, SocketEventType } from '../types/socket.types';
import User from '../models/User';
import chatService from './chat.service';

class SocketManager {
    private connections: Map<string, AuthenticatedSocket> = new Map();
    private io: Server | null = null;

    setIO(io: Server) {
        this.io = io;
    }

    addConnection(userId: string, socket: AuthenticatedSocket): void {
        socket.userId = userId;
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
        if (socket && socket.connected) {
            socket.emit('message', { ...message, timestamp: new Date() });
            return true;
        }
        return false;
    }

    broadcast(message: SocketMessage, excludeUserId?: string): void {
        if (!this.io) return;

        const payload = { ...message, timestamp: new Date() };
        if (excludeUserId) {
            const excludeSocket = this.connections.get(excludeUserId);
            if (excludeSocket) {
                excludeSocket.broadcast.emit('message', payload);
                return;
            }
        }
        this.io.emit('message', payload);
    }

    async handleConnection(socket: AuthenticatedSocket, io: Server) {
        this.setIO(io);
        let authenticatedUserId: string | null = null;

        // In Socket.io, we use named events instead of one 'message' event with switch/case
        // But to keep consistency with existing logic, we can listen to a generic 'message' event
        // or refactor to specific events. Let's keep it generic for minimal friction.
        socket.on('message', async (message: SocketMessage) => {
            try {
                switch (message.type) {
                    case SocketEventType.AUTH:
                        const { userId } = message.payload;
                        const user = await User.findByPk(userId);

                        if (!user) {
                            socket.emit('message', {
                                type: SocketEventType.AUTH_FAILED,
                                payload: { error: 'User not found' },
                            });
                            return;
                        }

                        authenticatedUserId = userId;
                        socket.userName = user.name;
                        this.addConnection(userId, socket);

                        await User.update(
                            { isOnline: true, lastSeen: new Date() },
                            { where: { id: userId } },
                        );

                        socket.emit('message', {
                            type: SocketEventType.AUTH_SUCCESS,
                            payload: { userId, userName: user.name },
                        });

                        this.broadcast(
                            {
                                type: SocketEventType.USER_ONLINE,
                                payload: { userId, userName: user.name },
                            },
                            userId,
                        );

                        socket.emit('message', {
                            type: SocketEventType.ONLINE_USERS,
                            payload: { users: this.getOnlineUsers() },
                        });

                        // Mark messages as delivered and notify senders
                        const notifications = await chatService.markMessagesAsDelivered(userId);
                        Object.entries(notifications || {}).forEach(([senderId, ids]) => {
                            this.sendToUser(senderId, {
                                type: SocketEventType.MESSAGE_DELIVERED,
                                payload: { messageIds: ids, receiverId: userId },
                            });
                        });
                        break;

                    case SocketEventType.MESSAGE_HISTORY:
                        if (!authenticatedUserId) return;

                        const {
                            receiverId: historyReceiverId,
                            projectId: historyProjectId,
                            page = 1,
                            limit = 50,
                        } = message.payload;
                        const history = await chatService.getMessageHistory(
                            authenticatedUserId,
                            historyProjectId,
                            historyReceiverId,
                            page,
                            limit,
                        );

                        socket.emit('message', {
                            type: SocketEventType.MESSAGE_HISTORY,
                            payload: {
                                messages: history.messages,
                                total: history.total,
                                page: history.page,
                                totalPages: history.totalPages,
                            },
                        });
                        break;

                    case SocketEventType.MESSAGE_SEND:
                        if (!authenticatedUserId) return;

                        const { receiver_id, projectId, content, attachments, clientMsgId } =
                            message.payload;

                        if (!content && (!attachments || attachments.length === 0)) {
                            socket.emit('message', {
                                type: SocketEventType.ERROR,
                                payload: { error: 'Message content or attachments required' },
                            });
                            return;
                        }

                        const sentMessage = await chatService.sendMessage(
                            authenticatedUserId,
                            receiver_id,
                            projectId,
                            content || '',
                            attachments,
                            clientMsgId,
                            this.isUserOnline(receiver_id),
                        );

                        const hasUploadingPlaceholder =
                            Array.isArray(sentMessage?.attachments) &&
                            sentMessage.attachments.some((a: any) => a?.url === 'uploading');

                        // Notify sender (for confirmation)
                        socket.emit('message', {
                            type: SocketEventType.MESSAGE_RECEIVED,
                            payload: sentMessage,
                        });

                        // Notify receiver if online
                        if (this.isUserOnline(receiver_id) && !hasUploadingPlaceholder) {
                            this.sendToUser(receiver_id, {
                                type: SocketEventType.MESSAGE_RECEIVED,
                                payload: sentMessage,
                            });
                        }
                        break;

                    case SocketEventType.GET_USER_PROJECTS:
                        if (!authenticatedUserId) return;
                        const projects = await chatService.getUserProjects(authenticatedUserId);
                        socket.emit('message', {
                            type: SocketEventType.USER_PROJECTS,
                            payload: { projects },
                        });
                        break;

                    case SocketEventType.GET_PROJECT_USERS:
                        if (!authenticatedUserId) return;
                        const { projectId: userProjectId } = message.payload;
                        const projectUsers = await chatService.getProjectUsers(
                            userProjectId,
                            authenticatedUserId,
                        );
                        socket.emit('message', {
                            type: SocketEventType.PROJECT_USERS,
                            payload: { users: projectUsers, projectId: userProjectId },
                        });
                        break;

                    case SocketEventType.MARK_AS_READ:
                        if (!authenticatedUserId) return;
                        const { messageIds } = message.payload;
                        const readNotifications = await chatService.markMessagesAsRead(
                            messageIds,
                            authenticatedUserId,
                        );
                        if (readNotifications) {
                            Object.entries(readNotifications).forEach(([senderId, ids]) => {
                                this.sendToUser(senderId, {
                                    type: SocketEventType.MESSAGE_READ,
                                    payload: { messageIds: ids, receiverId: authenticatedUserId },
                                });
                            });
                        }
                        break;

                    case SocketEventType.TYPING_START:
                        if (!authenticatedUserId) return;
                        const { projectId: typingProjectId } = message.payload;
                        this.broadcast(
                            {
                                type: SocketEventType.TYPING_START,
                                payload: {
                                    userId: authenticatedUserId,
                                    projectId: typingProjectId,
                                },
                            },
                            authenticatedUserId,
                        );
                        break;

                    case SocketEventType.TYPING_STOP:
                        if (!authenticatedUserId) return;
                        const { projectId: stopTypingProjectId } = message.payload;
                        this.broadcast(
                            {
                                type: SocketEventType.TYPING_STOP,
                                payload: {
                                    userId: authenticatedUserId,
                                    projectId: stopTypingProjectId,
                                },
                            },
                            authenticatedUserId,
                        );
                        break;

                    case SocketEventType.HEARTBEAT:
                        socket.emit('message', { type: SocketEventType.HEARTBEAT });
                        break;

                    default:
                        socket.emit('message', {
                            type: SocketEventType.ERROR,
                            payload: { error: 'Unknown event type' },
                        });
                }
            } catch (error) {
                console.error('Socket.io error:', error);
                socket.emit('message', {
                    type: SocketEventType.ERROR,
                    payload: { error: 'Internal server error' },
                });
            }
        });

        socket.on('disconnect', async (reason) => {
            console.log(`Socket.io client disconnected: ${socket.id}, reason: ${reason}`);

            if (authenticatedUserId) {
                // Remove connection immediately
                this.removeConnection(authenticatedUserId);

                try {
                    // Update DB status
                    await User.update(
                        { isOnline: false, lastSeen: new Date() },
                        { where: { id: authenticatedUserId } },
                    );

                    // Notify others
                    this.broadcast(
                        {
                            type: SocketEventType.USER_OFFLINE,
                            payload: { userId: authenticatedUserId, lastSeen: new Date() },
                        },
                        authenticatedUserId,
                    );
                } catch (error) {
                    console.error('Error handling disconnect:', error);
                }
            }
        });
    }
}

export default new SocketManager();
