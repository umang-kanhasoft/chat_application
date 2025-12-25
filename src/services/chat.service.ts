import { Op } from 'sequelize';
import Bid from '../models/Bid';
import Message, { MESSAGE_STATUS } from '../models/Message';
import Project from '../models/Project';
import User from '../models/User';
import { SocketEventType } from '../types/socket.types';
import socketManager from './socket.manager';

export class ChatService {
    async sendMessage(sender_id: string, receiver_id: string, projectId: string, content: string) {
        const message = await Message.create(
            {
                content,
                sender_id: sender_id,
                receiver_id: receiver_id,
                project_id: projectId,
                status: MESSAGE_STATUS.SENT,
            },
            { returning: true },
        );

        const sender = await User.findByPk(sender_id);

        const payload = {
            id: message.id,
            content: message.content,
            sender_id: message.sender_id,
            senderName: sender?.name,
            receiver_id: message.receiver_id,
            projectId: message.project_id,
            status: message.status,
            createdAt: message.createdAt,
        };

        const isReceiverOnline = socketManager.isUserOnline(receiver_id);
        if (isReceiverOnline) {
            await message.update({ status: MESSAGE_STATUS.DELIVERED });
            payload.status = MESSAGE_STATUS.DELIVERED;
        }

        socketManager.sendToUser(receiver_id, {
            type: SocketEventType.MESSAGE_RECEIVED,
            payload,
        });

        return payload;
    }

    async getMessageHistory(userId: string, projectId: string, otherUserId?: string, limit = 50) {
        const whereClause: any = { project_id: projectId };

        if (otherUserId) {
            whereClause[Op.or] = [
                { sender_id: userId, receiver_id: otherUserId },
                { sender_id: otherUserId, receiver_id: userId },
            ];
        }

        const messages = await Message.findAll({
            where: whereClause,
            include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
            order: [['createdAt', 'DESC']],
            limit,
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
        }));

        return messagesPayload.reverse();
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

            bids.forEach((bid: any) => {
                if (bid.user && bid.user.id !== currentUserId) {
                    users.push({
                        id: bid.user.id,
                        name: bid.user.name,
                        role: bid.user.role,
                        isOnline: bid.user.isOnline,
                        lastSeen: bid.user.lastSeen,
                    });
                }
            });
        } else {
            if (project.client_id !== currentUserId) {
                const client = await User.findByPk(project.client_id);
                if (client) {
                    users.push({
                        id: client.id,
                        name: client.name,
                        role: client.role,
                        isOnline: client.isOnline,
                        lastSeen: client.lastSeen,
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
}

export default new ChatService();
