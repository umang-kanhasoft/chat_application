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
    },
};
