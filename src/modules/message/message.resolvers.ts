import { GraphQLError } from 'graphql';
import { CreateMessageInput, UpdateMessageInput } from '../../graphql/schema/message';
import Message from '../../models/Message';
import Project from '../../models/Project';
import User from '../../models/User';
import toIsoString from '../../utils/convertDate';

interface MessageArgs {
    id: string;
}

interface CreateMessageArgs {
    data: CreateMessageInput;
}

interface UpdateMessageArgs {
    id: string;
    data: UpdateMessageInput;
}

export default {
    Query: {
        messages: async () => {
            return await Message.findAll();
        },
        message: async (_: unknown, { id }: MessageArgs) => {
            const data = await Message.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'sender',
                    },
                    {
                        model: User,
                        as: 'receiver',
                    },
                    {
                        model: Project,
                        as: 'project',
                    },
                ],
            });
            return data;
        },
    },
    Message: {
        createdAt: (message: Message) => toIsoString(message.createdAt),
        updatedAt: (message: Message) => toIsoString(message.updatedAt),
        replyTo: async (message: Message) => {
            if (!message.replyToId) return null;
            return await Message.findByPk(message.replyToId);
        },
    },

    Mutation: {
        createMessage: async (_: unknown, { data }: CreateMessageArgs) => {
            return await Message.create(data);
        },
        updateMessage: async (_: unknown, { id, data }: UpdateMessageArgs) => {
            const user = await Message.findByPk(id);
            if (!user) {
                throw new GraphQLError('Message not found', { extensions: { code: 'NOT_FOUND' } });
            }
            await user.update(data);
            return user;
        },
        addReaction: async (_: unknown, { messageId, emoji }: { messageId: string; emoji: string; }, context: any) => {
            const message = await Message.findByPk(messageId);
            if (!message) {
                throw new GraphQLError('Message not found', { extensions: { code: 'NOT_FOUND' } });
            }

            // Get current user ID from context
            const userId = context.user?.id;
            if (!userId) {
                throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
            }

            const reactions = message.reactions || [];
            const existingReactionIndex = reactions.findIndex((r: any) => r.emoji === emoji);

            if (existingReactionIndex > -1) {
                const reaction = reactions[existingReactionIndex];
                if (reaction.userIds.includes(userId)) {
                    // Toggle off: Remove user
                    reaction.userIds = reaction.userIds.filter((id: string) => id !== userId);
                    reaction.count = reaction.userIds.length;
                    if (reaction.count === 0) {
                        reactions.splice(existingReactionIndex, 1);
                    }
                } else {
                    // Add user
                    reaction.userIds.push(userId);
                    reaction.count++;
                }
            } else {
                reactions.push({
                    emoji,
                    count: 1,
                    userIds: [userId]
                });
            }

            // Sequelize JSONB update requires explict setChanged or new array ref
            message.reactions = [...reactions];
            await message.save(); // or message.update({ reactions })
            return message;
        }
    },
};
