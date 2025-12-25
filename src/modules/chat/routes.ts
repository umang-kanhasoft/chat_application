import { FastifyPluginAsync } from 'fastify';
import Message, { MESSAGE_STATUS } from '../../models/Message';
import User from '../../models/User';
import chatService from '../../services/chat.service';
import socketManager from '../../services/socket.manager';
import { AuthenticatedSocket, SocketEventType, SocketMessage } from '../../types/socket.types';

const chat: FastifyPluginAsync = async (fastify): Promise<void> => {
    fastify.get('/', { websocket: true }, async (connection, request) => {
        const socket = connection as AuthenticatedSocket;
        let authenticatedUserId: string | null = null;

        socket.on('message', async (data: Buffer) => {
            try {
                const message: SocketMessage = JSON.parse(data.toString());
                switch (message.type) {
                    case SocketEventType.AUTH:
                        const { userId } = message.payload;
                        const user = await User.findByPk(userId);

                        if (!user) {
                            socket.send(
                                JSON.stringify({
                                    type: SocketEventType.AUTH_FAILED,
                                    payload: { error: 'Invalid user' },
                                }),
                            );
                            socket.close();
                            return;
                        }

                        authenticatedUserId = userId;
                        socket.userName = user.name;
                        socketManager.addConnection(userId, socket);

                        await User.update(
                            { isOnline: true, lastSeen: new Date() },
                            { where: { id: userId } },
                        );

                        socket.send(
                            JSON.stringify({
                                type: SocketEventType.AUTH_SUCCESS,
                                payload: { userId, userName: user.name },
                            }),
                        );

                        socketManager.broadcast(
                            {
                                type: SocketEventType.USER_ONLINE,
                                payload: { userId, userName: user.name },
                            },
                            userId,
                        );

                        socket.send(
                            JSON.stringify({
                                type: SocketEventType.ONLINE_USERS,
                                payload: { users: socketManager.getOnlineUsers() },
                            }),
                        );
                        break;

                    case SocketEventType.MESSAGE_SEND:
                        if (!authenticatedUserId) {
                            socket.send(
                                JSON.stringify({
                                    type: SocketEventType.ERROR,
                                    payload: { error: 'Not authenticated' },
                                }),
                            );
                            return;
                        }

                        const { receiver_id, projectId, content } = message.payload;
                        const sentMessage = await chatService.sendMessage(
                            authenticatedUserId,
                            receiver_id,
                            projectId,
                            content,
                        );

                        socket.send(
                            JSON.stringify({
                                type: SocketEventType.MESSAGE_RECEIVED,
                                payload: sentMessage,
                            }),
                        );
                        break;

                    case SocketEventType.MESSAGE_HISTORY:
                        if (!authenticatedUserId) return;

                        const { projectId: pid, otherUserId } = message.payload;
                        const history = await chatService.getMessageHistory(
                            authenticatedUserId,
                            pid,
                            otherUserId,
                        );
                        socket.send(
                            JSON.stringify({
                                type: SocketEventType.MESSAGE_HISTORY,
                                payload: { messages: history },
                            }),
                        );
                        break;

                    case SocketEventType.GET_PROJECT_USERS:
                        if (!authenticatedUserId) return;

                        const { projectId: projId } = message.payload;
                        const users = await chatService.getProjectUsers(
                            projId,
                            authenticatedUserId,
                        );
                        socket.send(
                            JSON.stringify({
                                type: SocketEventType.PROJECT_USERS,
                                payload: { users },
                            }),
                        );
                        break;

                    case SocketEventType.GET_USER_PROJECTS:
                        if (!authenticatedUserId) return;

                        const projects = await chatService.getUserProjects(authenticatedUserId);
                        socket.send(
                            JSON.stringify({
                                type: SocketEventType.USER_PROJECTS,
                                payload: { projects },
                            }),
                        );
                        break;

                    case SocketEventType.MARK_AS_READ:
                        if (!authenticatedUserId) return;

                        const { messageIds } = message.payload;
                        await Message.update(
                            { status: MESSAGE_STATUS.READ },
                            { where: { id: messageIds, receiver_id: authenticatedUserId } },
                        );

                        const readMessages = await Message.findAll({
                            where: { id: messageIds },
                            attributes: ['id', 'sender_id'],
                        });

                        readMessages.forEach((msg) => {
                            socketManager.sendToUser(msg.sender_id, {
                                type: SocketEventType.MESSAGE_READ,
                                payload: { messageIds, readBy: authenticatedUserId },
                            });
                        });
                        break;

                    default:
                        socket.send(
                            JSON.stringify({
                                type: SocketEventType.ERROR,
                                payload: { error: 'Unknown event type' },
                            }),
                        );
                }
            } catch (error) {
                fastify.log.error(`WebSocket message error: ${error}`);
                socket.send(
                    JSON.stringify({
                        type: SocketEventType.ERROR,
                        payload: { error: 'Invalid message format' },
                    }),
                );
            }
        });

        socket.on('pong', () => {
            if (authenticatedUserId) {
                socketManager.handlePong(authenticatedUserId);
            }
        });

        socket.on('close', () => {
            if (authenticatedUserId) {
                User.update(
                    { isOnline: false, lastSeen: new Date() },
                    { where: { id: authenticatedUserId } },
                );
                socketManager.removeConnection(authenticatedUserId);
                socketManager.broadcast({
                    type: SocketEventType.USER_OFFLINE,
                    payload: { userId: authenticatedUserId },
                });
            }
        });

        socket.on('error', (error) => {
            fastify.log.error(`Socket error: ${error.message}`);
        });
    });
};

export default chat;
