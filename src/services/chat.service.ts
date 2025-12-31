import { Op } from 'sequelize';
import { getLogger } from '../config/logger';
import Attachment from '../models/Attachment';
import Bid from '../models/Bid';
import Message, { MESSAGE_STATUS } from '../models/Message';
import Project from '../models/Project';
import User from '../models/User';
import cacheService from './cache.service';

const log = getLogger('chat.service');

export class ChatService {
    private clientMsgIdToMessageId = new Map<string, { messageId: string; ts: number }>();
    private readonly clientMsgIdTtlMs = 6 * 60 * 60 * 1000;
    private lastClientMsgIdCleanupAt = 0;
    private readonly clientMsgIdCleanupIntervalMs = 60 * 1000;

    private cleanupClientMsgIdMap() {
        const now = Date.now();
        for (const [key, value] of this.clientMsgIdToMessageId.entries()) {
            if (now - value.ts > this.clientMsgIdTtlMs) {
                this.clientMsgIdToMessageId.delete(key);
            }
        }
    }

    private maybeCleanupClientMsgIdMap() {
        const now = Date.now();
        if (now - this.lastClientMsgIdCleanupAt < this.clientMsgIdCleanupIntervalMs) return;
        this.lastClientMsgIdCleanupAt = now;
        this.cleanupClientMsgIdMap();
    }

    async sendMessage(
        sender_id: string,
        receiver_id: string,
        projectId: string | null,
        content: string,
        attachments?: any[],
        clientMsgId?: string,
        isReceiverOnline?: boolean,
        senderName?: string,
    ) {
        try {
            this.maybeCleanupClientMsgIdMap();

            let message: any = null;
            if (clientMsgId) {
                const existing = this.clientMsgIdToMessageId.get(clientMsgId);
                if (existing?.messageId) {
                    message = await Message.findByPk(existing.messageId);
                    if (!message) {
                        this.clientMsgIdToMessageId.delete(clientMsgId);
                    }
                }
            }

            if (!message) {
                message = await Message.create(
                    {
                        content: content || '',
                        sender_id: sender_id,
                        receiver_id: receiver_id,
                        project_id: projectId,
                        status: MESSAGE_STATUS.SENT,
                    },
                    { returning: true },
                );
                if (clientMsgId) {
                    this.clientMsgIdToMessageId.set(clientMsgId, {
                        messageId: message.id,
                        ts: Date.now(),
                    });
                }
            } else {
                if (content && message.content !== content) {
                    void message.update({ content });
                }
            }

            const responseAttachments: any[] = [];
            const inputAttachments = Array.isArray(attachments) ? attachments : [];

            // Persist non-uploading attachments (if any) with batched lookups/inserts
            const toPersist = inputAttachments.filter(
                (att) => att?.url && att?.url !== 'uploading',
            );
            if (toPersist.length > 0) {
                const publicIds = toPersist.map((a) => a?.public_id).filter(Boolean);
                if (publicIds.length > 0) {
                    const existing = await Attachment.findAll({
                        where: {
                            message_id: message.id,
                            public_id: { [Op.in]: publicIds },
                        },
                        attributes: ['public_id'],
                    });
                    const existingSet = new Set((existing as any[]).map((e) => e.public_id));
                    const missing = toPersist.filter(
                        (a) => a?.public_id && !existingSet.has(a.public_id),
                    );

                    if (missing.length > 0) {
                        await Attachment.bulkCreate(
                            missing.map((att) => ({
                                message_id: message.id,
                                file_name: att.file_name,
                                file_size: att.file_size,
                                mime_type: att.mime_type,
                                storage_key: att.id || att.storage_key,
                                public_id: att.public_id,
                                url: att.url,
                                checksum: att.checksum || '',
                            })),
                        );
                    }
                }
            }

            // Build attachment payload from input to avoid extra DB reads on the hot path.
            for (const att of inputAttachments) {
                if (att?.url === 'uploading') {
                    responseAttachments.push({
                        id: att.id || att.storage_key || 'uploading',
                        file_name: att.file_name,
                        file_size: att.file_size,
                        mime_type: att.mime_type,
                        url: 'uploading',
                        public_id: att.public_id,
                    });
                } else if (att?.url) {
                    responseAttachments.push({
                        id: att.id || att.storage_key || att.public_id,
                        file_name: att.file_name,
                        file_size: att.file_size,
                        mime_type: att.mime_type,
                        url: att.url,
                        public_id: att.public_id,
                    });
                }
            }

            const sender = senderName ? null : await User.findByPk(sender_id);

            const payload: any = {
                id: message.id,
                clientMsgId: clientMsgId,
                content: message.content,
                sender_id: message.sender_id,
                senderName: senderName || sender?.name,
                receiver_id: message.receiver_id,
                projectId: message.project_id,
                status: message.status,
                createdAt: message.createdAt,
                attachments: responseAttachments,
            };

            if (isReceiverOnline && payload.status !== MESSAGE_STATUS.DELIVERED) {
                // Persist delivered status without blocking message fanout.
                void message.update({ status: MESSAGE_STATUS.DELIVERED });
                payload.status = MESSAGE_STATUS.DELIVERED;
            }

            await cacheService.invalidateChatCache(projectId, sender_id);
            await cacheService.invalidateChatCache(projectId, receiver_id);

            return payload;
        } catch (error) {
            log.error(
                { err: error, sender_id, receiver_id, projectId, clientMsgId },
                'Error in ChatService.sendMessage',
            );
            throw error;
        }
    }

    async getMessageHistory(
        userId: string,
        projectId: string | null,
        otherUserId?: string,
        page = 1,
        limit = 50,
    ) {
        const normalizedProjectId = projectId ?? 'global';
        const cacheKey = `chat:${normalizedProjectId}:${userId}:${otherUserId || 'all'}:${page}:${limit}`;
        // Try cache first
        const cached = await cacheService.getChatHistory(cacheKey);
        if (cached) return { messages: cached, total: cached.length, page, totalPages: 1 };

        const offset = (page - 1) * limit;
        const whereClause: any = {
            project_id: projectId === null ? { [Op.is]: null } : projectId,
        };

        if (otherUserId) {
            whereClause[Op.or] = [
                { sender_id: userId, receiver_id: otherUserId },
                { sender_id: otherUserId, receiver_id: userId },
            ];
        }

        const { count, rows: messages } = await Message.findAndCountAll({
            where: whereClause,
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name'] },
                { model: Attachment, as: 'attachments' },
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });

        const messagesPayload = messages.map((message: any) => ({
            id: message.id,
            content: message.content,
            sender_id: message.sender_id,
            senderName: message.sender?.name,
            receiver_id: message.receiver_id,
            projectId: message.project_id,
            status: message.status || 'SENT',
            createdAt: message.createdAt,
            attachments:
                message.attachments?.map((att: any) => ({
                    id: att.id,
                    file_name: att.file_name,
                    file_size: att.file_size,
                    mime_type: att.mime_type,
                    url: att.url,
                    public_id: att.public_id,
                })) || [],
        }));

        const result = {
            messages: messagesPayload.reverse(),
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
        };

        await cacheService.setChatHistory(cacheKey, result.messages);
        return result;
    }

    async getGlobalUsers(currentUserId: string) {
        const cacheKey = `global_users:v2:${currentUserId}`;

        const cached = await cacheService.getChatHistory(cacheKey);
        if (cached) return cached;

        const users = await User.findAll({
            where: {
                id: { [Op.ne]: currentUserId },
            },
            attributes: ['id', 'name', 'role', 'isOnline', 'lastSeen'],
            order: [['name', 'ASC']],
        });

        const results = [] as any[];
        for (const u of users as any[]) {
            const unreadCount = await Message.count({
                where: {
                    sender_id: u.id,
                    receiver_id: currentUserId,
                    project_id: { [Op.is]: null },
                    status: { [Op.ne]: MESSAGE_STATUS.READ },
                },
            });

            results.push({
                id: u.id,
                name: u.name,
                role: u.role,
                isOnline: u.isOnline,
                lastSeen: u.lastSeen,
                unreadCount,
            });
        }

        await cacheService.setChatHistory(cacheKey, results, 120);
        return results;
    }

    async getProjectUsers(projectId: string, currentUserId: string) {
        const cacheKey = `project_users:${projectId}:${currentUserId}`;

        const cached = await cacheService.getChatHistory(cacheKey);
        if (cached) return cached;

        const project = await Project.findByPk(projectId);
        if (!project) return [];

        const currentUser = await User.findByPk(currentUserId);
        const users = [];

        if (currentUser?.role === 'CLIENT' || currentUser?.role === 'BOTH') {
            const bids = await Bid.findAll({
                where: { project_id: projectId },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'role', 'isOnline', 'lastSeen'],
                    },
                ],
            });

            for (const bid of bids) {
                const b = bid as any;
                if (b.user && b.user.id !== currentUserId) {
                    const unreadCount = await Message.count({
                        where: {
                            sender_id: b.user.id,
                            receiver_id: currentUserId,
                            project_id: projectId,
                            status: { [Op.ne]: MESSAGE_STATUS.READ },
                        },
                    });

                    users.push({
                        id: b.user.id,
                        name: b.user.name,
                        role: b.user.role,
                        isOnline: b.user.isOnline,
                        lastSeen: b.user.lastSeen,
                        unreadCount,
                    });
                }
            }
        } else {
            if (project.client_id !== currentUserId) {
                const client = await User.findByPk(project.client_id);
                if (client) {
                    const unreadCount = await Message.count({
                        where: {
                            sender_id: client.id,
                            receiver_id: currentUserId,
                            project_id: projectId,
                            status: { [Op.ne]: MESSAGE_STATUS.READ },
                        },
                    });

                    users.push({
                        id: client.id,
                        name: client.name,
                        role: client.role,
                        isOnline: client.isOnline,
                        lastSeen: client.lastSeen,
                        unreadCount,
                    });
                }
            }
        }

        await cacheService.setChatHistory(cacheKey, users, 600);

        return users;
    }

    async getUserProjects(userId: string) {
        const user = await User.findByPk(userId);
        if (!user) return [];

        let projects = [];

        if (user.role === 'CLIENT' || user.role === 'BOTH') {
            const clientProjects = await Project.findAll({
                where: { client_id: userId },
                attributes: ['id', 'title', 'status'],
            });
            projects = clientProjects.map((p: any) => ({
                id: p.id,
                title: p.title,
                status: p.status,
            }));
        } else {
            const bids = await Bid.findAll({
                where: { user_id: userId },
                include: [{ model: Project, as: 'project', attributes: ['id', 'title', 'status'] }],
            });
            projects = bids.map((bid: any) => ({
                id: bid.project.id,
                title: bid.project.title,
                status: bid.project.status,
            }));
        }

        return projects;
    }

    async markMessagesAsRead(messageIds: string[], userId: string) {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const safeMessageIds = Array.isArray(messageIds)
            ? messageIds.filter((id) => typeof id === 'string' && uuidRegex.test(id))
            : [];

        if (safeMessageIds.length === 0) return;

        // Find messages to be updated to get their sender IDs
        const messages = await Message.findAll({
            where: {
                id: { [Op.in]: safeMessageIds },
                receiver_id: userId,
                status: { [Op.ne]: MESSAGE_STATUS.READ },
            },
            attributes: ['id', 'sender_id'],
        });

        if (messages.length === 0) return;

        // Update status in DB
        await Message.update(
            { status: MESSAGE_STATUS.READ },
            {
                where: {
                    id: { [Op.in]: messages.map((m) => m.id) },
                },
            },
        );

        // Group message IDs by sender to notify them
        const notifications = messages.reduce((acc: Record<string, string[]>, msg) => {
            if (!acc[msg.sender_id]) {
                acc[msg.sender_id] = [];
            }
            acc[msg.sender_id].push(msg.id);
            return acc;
        }, {});

        return notifications;
    }

    async markMessagesAsDelivered(userId: string) {
        // Find messages to be updated (sent to this user but not delivered/read)
        const messages = await Message.findAll({
            where: {
                receiver_id: userId,
                status: MESSAGE_STATUS.SENT,
            },
            attributes: ['id', 'sender_id'],
        });

        if (messages.length === 0) return;

        // Update status in DB
        await Message.update(
            { status: MESSAGE_STATUS.DELIVERED },
            {
                where: {
                    id: { [Op.in]: messages.map((m) => m.id) },
                },
            },
        );

        // Group message IDs by sender to notify them
        const notifications = messages.reduce((acc: Record<string, string[]>, msg) => {
            if (!acc[msg.sender_id]) {
                acc[msg.sender_id] = [];
            }
            acc[msg.sender_id].push(msg.id);
            return acc;
        }, {});

        return notifications;
    }
}

export default new ChatService();
