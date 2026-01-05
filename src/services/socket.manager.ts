import { SpanStatusCode, trace } from '@opentelemetry/api';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server } from 'socket.io';
import { config } from '../config/config';
import { getLogger } from '../config/logger';
import { Sentry } from '../config/sentry';
import User from '../models/User';
import { AuthenticatedSocket, SocketEventType, SocketMessage } from '../types/socket.types';
import chatService from './chat.service';
import fcmService from './fcm.service';

const log = getLogger('socket.manager');

class SocketManager {
    private connections: Map<string, Set<AuthenticatedSocket>> = new Map();
    private io: Server | null = null;
    private tracer = trace.getTracer('websocket-manager');
    private adapterConfigured = false;

    private disconnectGraceTimers = new Map<string, ReturnType<typeof setTimeout>>();

    private activeCalls = new Map<
        string,
        {
            callId: string;
            callerId: string;
            callerName?: string;
            calleeId: string;
            status: 'RINGING' | 'ACCEPTED';
        }
    >();

    private userActiveCall = new Map<string, string>();

    private pubClient = createClient({
        username: config.redis.username,
        password: config.redis.password,
        socket: {
            host: config.redis.host,
            port: config.redis.port,
        },
    });
    private subClient = this.pubClient.duplicate();

    private messageCounts = new Map<string, { count: number; resetTime: number }>();

    private cleanupCall(callId: string) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        this.activeCalls.delete(callId);
        this.userActiveCall.delete(call.callerId);
        this.userActiveCall.delete(call.calleeId);
    }

    private endCall(callId: string, endedByUserId: string, reason?: string) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        const otherUserId = endedByUserId === call.callerId ? call.calleeId : call.callerId;
        this.sendToUser(otherUserId, {
            type: SocketEventType.CALL_END,
            payload: {
                callId,
                endedBy: endedByUserId,
                reason: reason || 'ended',
            },
        });

        this.cleanupCall(callId);
    }

    constructor() {
        this.connectRedis().catch((error) => {
            log.error({ err: error }, 'Redis connection failed');
        });
    }

    private async connectRedis() {
        try {
            await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
        } catch (error) {
            log.error({ err: error }, 'Redis connection failed');
        }
    }

    private checkMessageRate(userId: string): boolean {
        const now = Date.now();
        const userLimit = this.messageCounts.get(userId);

        if (!userLimit || now > userLimit.resetTime) {
            this.messageCounts.set(userId, { count: 1, resetTime: now + 60000 });
            return true;
        }

        if (userLimit.count >= 30) {
            // 30 messages per minute
            return false;
        }

        userLimit.count++;
        return true;
    }

    setIO(io: Server) {
        this.io = io;
        if (this.adapterConfigured) return;
        if (!this.pubClient.isOpen || !this.subClient.isOpen) {
            return;
        }
        this.io.adapter(createAdapter(this.pubClient, this.subClient));
        this.adapterConfigured = true;
    }

    addConnection(userId: string, socket: AuthenticatedSocket): void {
        socket.userId = userId;
        const existing = this.connections.get(userId);
        if (existing) {
            existing.add(socket);
            return;
        }
        this.connections.set(userId, new Set([socket]));
    }

    removeConnection(userId: string, socketId?: string): void {
        const sockets = this.connections.get(userId);
        if (!sockets) return;

        if (!socketId) {
            this.connections.delete(userId);
            return;
        }

        for (const s of sockets) {
            if (s.id === socketId) {
                sockets.delete(s);
                break;
            }
        }

        if (sockets.size === 0) {
            this.connections.delete(userId);
        }
    }

    isUserOnline(userId: string): boolean {
        const sockets = this.connections.get(userId);
        return Boolean(sockets && sockets.size > 0);
    }

    getOnlineUsers(): string[] {
        return Array.from(this.connections.entries())
            .filter(([, sockets]) => sockets.size > 0)
            .map(([userId]) => userId);
    }

    sendToUser(userId: string, message: SocketMessage): boolean {
        const sockets = this.connections.get(userId);
        if (!sockets || sockets.size === 0) return false;

        const payload = { ...message, timestamp: new Date() };
        let sent = false;
        for (const socket of sockets) {
            if (!socket.connected) continue;
            socket.emit('message', payload);
            sent = true;
        }
        return sent;
    }

    broadcast(message: SocketMessage, excludeUserId?: string): void {
        if (!this.io) return;

        const payload = { ...message, timestamp: new Date() };
        if (excludeUserId) {
            for (const [userId, sockets] of this.connections.entries()) {
                if (userId === excludeUserId) continue;
                for (const socket of sockets) {
                    if (!socket.connected) continue;
                    socket.emit('message', payload);
                }
            }
            return;
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
            const span = this.tracer.startSpan(`ws.message ${message.type}`);
            span.setAttribute('ws.event_type', message.type);
            if (socket.userId) span.setAttribute('ws.user_id', socket.userId);

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

                        const pending = this.disconnectGraceTimers.get(userId);
                        if (pending) {
                            clearTimeout(pending);
                            this.disconnectGraceTimers.delete(userId);
                        }

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
                            projectId: rawHistoryProjectId,
                            page = 1,
                            limit = 50,
                        } = message.payload;
                        const historyProjectId: string | null = rawHistoryProjectId ?? null;
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

                        if (!this.checkMessageRate(authenticatedUserId)) {
                            socket.emit('message', {
                                type: SocketEventType.ERROR,
                                payload: { error: 'Rate limit exceeded. Please slow down.' },
                            });
                            return;
                        }

                        const {
                            receiver_id,
                            projectId: rawProjectId,
                            content,
                            attachments,
                            clientMsgId,
                            replyToId,
                        } = message.payload;
                        const projectId: string | null = rawProjectId ?? null;

                        if (!content && (!attachments || attachments.length === 0)) {
                            socket.emit('message', {
                                type: SocketEventType.ERROR,
                                payload: { error: 'Message content or attachments required' },
                            });
                            return;
                        }

                        const receiverOnline = this.isUserOnline(receiver_id);
                        const hasUploadingPlaceholder =
                            Array.isArray(attachments) &&
                            attachments.some((a: any) => a?.url === 'uploading');

                        if (clientMsgId) {
                            const nowIso = new Date().toISOString();
                            const provisional = {
                                id: clientMsgId,
                                clientMsgId,
                                content: content || '',
                                sender_id: authenticatedUserId,
                                senderName: socket.userName,
                                receiver_id,
                                projectId,
                                status: 'SENT',
                                createdAt: nowIso,
                                attachments: Array.isArray(attachments) ? attachments : [],
                                replyToId,
                            };

                            socket.emit('message', {
                                type: SocketEventType.MESSAGE_RECEIVED,
                                payload: provisional,
                            });

                            if (receiverOnline && !hasUploadingPlaceholder) {
                                this.sendToUser(receiver_id, {
                                    type: SocketEventType.MESSAGE_RECEIVED,
                                    payload: provisional,
                                });
                            }
                        }

                        try {
                            const sentMessage = await chatService.sendMessage(
                                authenticatedUserId,
                                receiver_id,
                                projectId,
                                content || '',
                                attachments,
                                clientMsgId,
                                receiverOnline,
                                socket.userName,
                                replyToId,
                            );

                            socket.emit('message', {
                                type: SocketEventType.MESSAGE_RECEIVED,
                                payload: sentMessage,
                            });

                            if (receiverOnline && !hasUploadingPlaceholder) {
                                this.sendToUser(receiver_id, {
                                    type: SocketEventType.MESSAGE_RECEIVED,
                                    payload: sentMessage,
                                });
                            }

                            // Send Push Notification
                            if (sentMessage) {
                                // Don't await this, let it run in background to avoid blocking the socket loop
                                log.info(
                                    {
                                        receiverId: receiver_id,
                                        senderId: authenticatedUserId,
                                        messageId: sentMessage.id,
                                    },
                                    'Sending FCM notification for new message',
                                );
                                fcmService
                                    .sendNotification(receiver_id, {
                                        title: `New message from ${socket.userName || 'User'}`,
                                        body:
                                            content ||
                                            (attachments?.length
                                                ? 'Sent an attachment'
                                                : 'New message'),
                                        data: {
                                            type: 'NEW_MESSAGE',
                                            messageId: sentMessage.id,
                                            senderId: authenticatedUserId,
                                            projectId: projectId || '',
                                            url: '/',
                                        },
                                    })
                                    .catch((err) =>
                                        log.error({ err }, 'Failed to send notification'),
                                    );
                            }
                        } catch (error) {
                            log.error({ err: error }, 'Error persisting chat message');
                            Sentry.captureException(error, {
                                tags: { component: 'websocket', event: 'message_send_persist' },
                                user: { id: authenticatedUserId },
                            });

                            socket.emit('message', {
                                type: SocketEventType.ERROR,
                                payload: {
                                    error: 'Failed to send message',
                                    clientMsgId,
                                },
                            });
                        }
                        break;

                    case SocketEventType.REGISTER_DEVICE:
                        if (!authenticatedUserId) return;
                        const { token, platform } = message.payload;
                        if (token) {
                            log.info(
                                {
                                    userId: authenticatedUserId,
                                    platform,
                                    tokenPrefix: token.slice(0, 12),
                                },
                                'Registering device token',
                            );
                            await fcmService.registerDevice(authenticatedUserId, token, platform);
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

                    case SocketEventType.GET_GLOBAL_USERS:
                        if (!authenticatedUserId) return;
                        const globalUsers = await chatService.getGlobalUsers(authenticatedUserId);
                        socket.emit('message', {
                            type: SocketEventType.GLOBAL_USERS,
                            payload: { users: globalUsers },
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
                        const typingProjectId: string | null = message.payload?.projectId ?? null;
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

                    case SocketEventType.CALL_START:
                        if (!authenticatedUserId) return;

                        const { callId, toUserId } = message.payload || {};
                        if (!callId || !toUserId) {
                            socket.emit('message', {
                                type: SocketEventType.ERROR,
                                payload: { error: 'callId and toUserId required' },
                            });
                            return;
                        }

                        if (this.userActiveCall.has(authenticatedUserId)) {
                            socket.emit('message', {
                                type: SocketEventType.CALL_BUSY,
                                payload: { callId, userId: authenticatedUserId },
                            });
                            return;
                        }

                        if (this.userActiveCall.has(toUserId)) {
                            socket.emit('message', {
                                type: SocketEventType.CALL_BUSY,
                                payload: { callId, userId: toUserId },
                            });
                            return;
                        }

                        const receiverOnlineForCall = this.isUserOnline(toUserId);
                        if (!receiverOnlineForCall) {
                            socket.emit('message', {
                                type: SocketEventType.CALL_REJECT,
                                payload: { callId, reason: 'User is offline' },
                            });
                            return;
                        }

                        this.activeCalls.set(callId, {
                            callId,
                            callerId: authenticatedUserId,
                            callerName: socket.userName,
                            calleeId: toUserId,
                            status: 'RINGING',
                        });
                        this.userActiveCall.set(authenticatedUserId, callId);
                        this.userActiveCall.set(toUserId, callId);

                        this.sendToUser(toUserId, {
                            type: SocketEventType.CALL_RINGING,
                            payload: {
                                callId,
                                fromUserId: authenticatedUserId,
                                fromUserName: socket.userName,
                            },
                        });
                        break;

                    case SocketEventType.CALL_ACCEPT:
                        if (!authenticatedUserId) return;
                        const { callId: acceptCallId } = message.payload || {};
                        if (!acceptCallId) return;

                        const callToAccept = this.activeCalls.get(acceptCallId);
                        if (!callToAccept) return;
                        if (callToAccept.calleeId !== authenticatedUserId) return;

                        callToAccept.status = 'ACCEPTED';
                        this.sendToUser(callToAccept.callerId, {
                            type: SocketEventType.CALL_ACCEPT,
                            payload: { callId: acceptCallId, fromUserId: authenticatedUserId },
                        });
                        break;

                    case SocketEventType.CALL_REJECT:
                        if (!authenticatedUserId) return;
                        const { callId: rejectCallId, reason: rejectReason } =
                            message.payload || {};
                        if (!rejectCallId) return;

                        const callToReject = this.activeCalls.get(rejectCallId);
                        if (!callToReject) return;
                        if (
                            callToReject.callerId !== authenticatedUserId &&
                            callToReject.calleeId !== authenticatedUserId
                        ) {
                            return;
                        }

                        const otherUserIdForReject =
                            authenticatedUserId === callToReject.callerId
                                ? callToReject.calleeId
                                : callToReject.callerId;
                        this.sendToUser(otherUserIdForReject, {
                            type: SocketEventType.CALL_REJECT,
                            payload: { callId: rejectCallId, reason: rejectReason || 'rejected' },
                        });
                        this.cleanupCall(rejectCallId);
                        break;

                    case SocketEventType.CALL_OFFER:
                        if (!authenticatedUserId) return;
                        const { callId: offerCallId, sdp: offerSdp } = message.payload || {};
                        if (!offerCallId || !offerSdp) return;

                        const offerCall = this.activeCalls.get(offerCallId);
                        if (!offerCall) return;

                        const offerTargetUserId =
                            authenticatedUserId === offerCall.callerId
                                ? offerCall.calleeId
                                : offerCall.callerId;
                        this.sendToUser(offerTargetUserId, {
                            type: SocketEventType.CALL_OFFER,
                            payload: {
                                callId: offerCallId,
                                fromUserId: authenticatedUserId,
                                sdp: offerSdp,
                            },
                        });
                        break;

                    case SocketEventType.CALL_ANSWER:
                        if (!authenticatedUserId) return;
                        const { callId: answerCallId, sdp: answerSdp } = message.payload || {};
                        if (!answerCallId || !answerSdp) return;

                        const answerCall = this.activeCalls.get(answerCallId);
                        if (!answerCall) return;

                        const answerTargetUserId =
                            authenticatedUserId === answerCall.callerId
                                ? answerCall.calleeId
                                : answerCall.callerId;
                        this.sendToUser(answerTargetUserId, {
                            type: SocketEventType.CALL_ANSWER,
                            payload: {
                                callId: answerCallId,
                                fromUserId: authenticatedUserId,
                                sdp: answerSdp,
                            },
                        });
                        break;

                    case SocketEventType.CALL_ICE_CANDIDATE:
                        if (!authenticatedUserId) return;
                        const { callId: iceCallId, candidate } = message.payload || {};
                        if (!iceCallId || !candidate) return;

                        const iceCall = this.activeCalls.get(iceCallId);
                        if (!iceCall) return;

                        const iceTargetUserId =
                            authenticatedUserId === iceCall.callerId
                                ? iceCall.calleeId
                                : iceCall.callerId;
                        this.sendToUser(iceTargetUserId, {
                            type: SocketEventType.CALL_ICE_CANDIDATE,
                            payload: {
                                callId: iceCallId,
                                fromUserId: authenticatedUserId,
                                candidate,
                            },
                        });
                        break;

                    case SocketEventType.CALL_END:
                        if (!authenticatedUserId) return;
                        const { callId: endCallId, reason: endReason } = message.payload || {};
                        if (!endCallId) return;

                        this.endCall(endCallId, authenticatedUserId, endReason);
                        break;

                    case SocketEventType.TYPING_STOP:
                        if (!authenticatedUserId) return;
                        const stopTypingProjectId: string | null =
                            message.payload?.projectId ?? null;
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
                        log.warn(
                            { userId: authenticatedUserId || socket.userId, type: message.type },
                            'Unknown websocket event type',
                        );
                        socket.emit('message', {
                            type: SocketEventType.ERROR,
                            payload: { error: 'Unknown event type', receivedType: message.type },
                        });
                        break;
                }
            } catch (error) {
                if (error instanceof Error) {
                    span.recordException(error);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

                    const spanContext = span.spanContext();
                    Sentry.captureException(error, {
                        user: {
                            id: authenticatedUserId || socket.userId,
                        },
                        tags: {
                            component: 'websocket',
                            ws_event_type: message.type,
                            trace_id: spanContext.traceId,
                            span_id: spanContext.spanId,
                        },
                    });
                } else {
                    Sentry.captureException(error, {
                        tags: {
                            component: 'websocket',
                            ws_event_type: message.type,
                        },
                        user: {
                            id: authenticatedUserId || socket.userId,
                        },
                    });
                }

                socket.emit('message', {
                    type: SocketEventType.ERROR,
                    payload: { error: 'Internal server error' },
                });
            } finally {
                span.end();
            }
        });

        socket.on('disconnect', async (reason) => {
            if (authenticatedUserId) {
                const userId = authenticatedUserId;

                this.removeConnection(userId, socket.id);

                const stillOnline = this.isUserOnline(userId);
                if (!stillOnline) {
                    const activeCallId = this.userActiveCall.get(userId);
                    if (activeCallId) {
                        if (!this.disconnectGraceTimers.has(userId)) {
                            const graceUserId = userId;
                            const timer = setTimeout(async () => {
                                this.disconnectGraceTimers.delete(graceUserId);

                                // User reconnected during grace window
                                if (this.isUserOnline(graceUserId)) return;

                                const callId = this.userActiveCall.get(graceUserId);
                                if (callId) {
                                    this.endCall(callId, graceUserId, 'disconnect');
                                }

                                this.messageCounts.delete(graceUserId);

                                try {
                                    await User.update(
                                        { isOnline: false, lastSeen: new Date() },
                                        { where: { id: graceUserId } },
                                    );

                                    this.broadcast(
                                        {
                                            type: SocketEventType.USER_OFFLINE,
                                            payload: {
                                                userId: graceUserId,
                                                lastSeen: new Date(),
                                            },
                                        },
                                        graceUserId,
                                    );
                                } catch (error) {
                                    log.error({ err: error }, 'Error handling disconnect');
                                    Sentry.captureException(error, {
                                        tags: { component: 'websocket', event: 'disconnect' },
                                        user: { id: graceUserId },
                                    });
                                }
                            }, 15000);
                            this.disconnectGraceTimers.set(userId, timer);
                        }

                        return;
                    }

                    this.messageCounts.delete(userId);
                }

                try {
                    if (!stillOnline) {
                        await User.update(
                            { isOnline: false, lastSeen: new Date() },
                            { where: { id: userId } },
                        );

                        this.broadcast(
                            {
                                type: SocketEventType.USER_OFFLINE,
                                payload: { userId, lastSeen: new Date() },
                            },
                            userId,
                        );
                    }
                } catch (error) {
                    log.error({ err: error }, 'Error handling disconnect');
                    Sentry.captureException(error, {
                        tags: { component: 'websocket', event: 'disconnect' },
                        user: { id: userId },
                    });
                }
            }
        });
    }
}

export default new SocketManager();
