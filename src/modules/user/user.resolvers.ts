import { GraphQLError } from 'graphql';
import { CreateUserInput, UpdateUserInput } from '../../graphql/schema/user';
import User from '../../models/User';
import { getUserById } from './userService';

export default {
    Query: {
        users: async () => {
            return await User.findAll();
        },
        user: async (_: any, { id }: { id: string }) => {
            return await getUserById(id);
        },
    },

    Mutation: {
        createUser: async (_: any, { data }: { data: CreateUserInput }) => {
            return await User.create(data);
        },
        updateUser: async (_: any, { id, data }: { id: string; data: UpdateUserInput }) => {
            const user = await User.findByPk(id);
            if (!user) {
                throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
            }
            await user.update(data);
            return user;
        },
    },
};
