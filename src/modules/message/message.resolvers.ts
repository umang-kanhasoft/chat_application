import { GraphQLError } from 'graphql';
import { CreateMessageInput, UpdateMessageInput } from '../../graphql/schema/message';
import Message from '../../models/Message';
import Project from '../../models/Project';
import User from '../../models/User';

export default {
    Query: {
        messages: async () => {
            return await Message.findAll();
        },
        message: async (_: any, { id }: { id: string }) => {
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

    Mutation: {
        createMessage: async (_: any, { data }: { data: CreateMessageInput }) => {
            return await Message.create(data);
        },
        updateMessage: async (_: any, { id, data }: { id: string; data: UpdateMessageInput }) => {
            const user = await Message.findByPk(id);
            if (!user) {
                throw new GraphQLError('Message not found', { extensions: { code: 'NOT_FOUND' } });
            }
            await user.update(data);
            return user;
        },
    },
};
