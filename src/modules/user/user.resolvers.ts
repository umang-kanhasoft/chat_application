import { GraphQLError } from 'graphql';
import { CreateUserInput, UpdateUserInput } from '../../graphql/schema/user';
import Bid from '../../models/Bid';
import Message from '../../models/Message';
import Project from '../../models/Project';
import ProjectSkill from '../../models/ProjectSkill';
import Skill from '../../models/Skill';
import User from '../../models/User';
import UserSkill from '../../models/UserSkill';
import cacheService from '../../services/cache.service';

interface UserArgs {
    id: string;
}

interface CreateUserArgs {
    data: CreateUserInput;
}

interface UpdateUserArgs {
    id: string;
    data: UpdateUserInput;
}

export default {
    Query: {
        users: async () => {
            return await User.findAll();
        },
        user: async (_: unknown, { id }: UserArgs) => {
            return await User.findByPk(id);
        },
    },

    User: {
        user_skills: async (user: User) => {
            return await UserSkill.findAll({
                where: { user_id: user.id },
            });
        },
        authoredProjects: async (user: User) => {
            return await Project.findAll({ where: { client_id: user.id } });
        },
        bids: async (user: User) => {
            return await Bid.findAll({ where: { user_id: user.id } });
        },
        sendMessage: async (user: User) => {
            return await Message.findAll({ where: { sender_id: user.id } });
        },
        receivedMessage: async (user: User) => {
            return await Message.findAll({ where: { receiver_id: user.id } });
        },
    },

    Mutation: {
        createUser: async (_: unknown, { data }: CreateUserArgs) => {
            const user = await User.create(data);
            await cacheService.invalidateGlobalUserCache();
            return user;
        },
        updateUser: async (_: unknown, { id, data }: UpdateUserArgs) => {
            const user = await User.findByPk(id);
            if (!user) {
                throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
            }
            await user.update(data);
            return user;
        },
    },
};
