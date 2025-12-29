import { Op } from 'sequelize';
import Attachment from '../models/Attachment';
import Bid from '../models/Bid';
import Message, { MESSAGE_STATUS } from '../models/Message';
import Project from '../models/Project';
import User from '../models/User';

export class ChatService {
    private clientMsgIdToMessageId = new Map<string, { messageId: string; ts: number }>();
    private readonly clientMsgIdTtlMs = 6 * 60 * 60 * 1000;

    private cleanupClientMsgIdMap() {
        const now = Date.now();
        for (const [key, value] of this.clientMsgIdToMessageId.entries()) {
            if (now - value.ts > this.clientMsgIdTtlMs) {
                this.clientMsgIdToMessageId.delete(key);
            }
        }
    }

    async sendMessage(
        sender_id: string,
        receiver_id: string,
        projectId: string,
        content: string,
        attachments?: any[],
        clientMsgId?: string,
        isReceiverOnline?: boolean,
    ) {
        try {
            this.cleanupClientMsgIdMap();

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
                    await message.update({ content });
                }
            }

            const responseAttachments: any[] = [];
            const uploadingAttachments: any[] = [];

            if (attachments && attachments.length > 0) {
                for (const att of attachments) {
                    if (att?.url === 'uploading') {
                        uploadingAttachments.push(att);
                        continue;
                    }

                    if (att?.public_id && att?.url) {
                        const existingAttachment = await Attachment.findOne({
                            where: { message_id: message.id, public_id: att.public_id },
                        });
                        if (!existingAttachment) {
                            await Attachment.create({
                                message_id: message.id,
                                file_name: att.file_name,
                                file_size: att.file_size,
                                mime_type: att.mime_type,
                                storage_key: att.id || att.storage_key,
                                public_id: att.public_id,
                                url: att.url,
                                checksum: att.checksum || '',
                            });
                        }
                    }
                }
            }

            const savedAttachments = await Attachment.findAll({
                where: { message_id: message.id },
            });
            for (const att of savedAttachments as any[]) {
                responseAttachments.push({
                    id: att.id,
                    file_name: att.file_name,
                    file_size: att.file_size,
                    mime_type: att.mime_type,
                    url: att.url,
                    public_id: att.public_id,
                });
            }

            for (const att of uploadingAttachments) {
                responseAttachments.push({
                    id: att.id || att.storage_key || 'uploading',
                    file_name: att.file_name,
                    file_size: att.file_size,
                    mime_type: att.mime_type,
                    url: 'uploading',
                    public_id: att.public_id,
                });
            }

            const sender = await User.findByPk(sender_id);

            const payload: any = {
                id: message.id,
                clientMsgId: clientMsgId,
                content: message.content,
                sender_id: message.sender_id,
                senderName: sender?.name,
                receiver_id: message.receiver_id,
                projectId: message.project_id,
                status: message.status,
                createdAt: message.createdAt,
                attachments: responseAttachments,
            };

            if (isReceiverOnline && payload.status !== MESSAGE_STATUS.DELIVERED) {
                await message.update({ status: MESSAGE_STATUS.DELIVERED });
                payload.status = MESSAGE_STATUS.DELIVERED;
            }

            return payload;
        } catch (error) {
            console.error('Error in ChatService.sendMessage:', error);
            throw error;
        }
    }

    async getMessageHistory(
        userId: string,
        projectId: string,
        otherUserId?: string,
        page = 1,
        limit = 50,
    ) {
        const offset = (page - 1) * limit;
        const whereClause: any = { project_id: projectId };

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

        return {
            messages: messagesPayload.reverse(),
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
        };
    }

    async getProjectUsers(projectId: string, currentUserId: string) {
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
        // Find messages to be updated to get their sender IDs
        const messages = await Message.findAll({
            where: {
                id: { [Op.in]: messageIds },
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
