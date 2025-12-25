import { GraphQLError } from 'graphql';
import { CreateUserInput, UpdateUserInput } from '../../graphql/schema/user';
import Bid from '../../models/Bid';
import Message from '../../models/Message';
import Project from '../../models/Project';
import ProjectSkill from '../../models/ProjectSkill';
import Skill from '../../models/Skill';
import User from '../../models/User';
import UserSkill from '../../models/UserSkill';

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
            return await User.findByPk(id, {
                include: [
                    {
                        model: UserSkill,
                        as: 'user_skills',
                        include: [{ model: Skill, as: 'skill' }],
                    },
                    {
                        model: Project,
                        as: 'authoredProjects',
                        include: [
                            {
                                model: ProjectSkill,
                                as: 'project_skills',
                                include: [{ model: Skill, as: 'skill' }],
                            },
                        ],
                    },
                    {
                        model: Bid,
                        as: 'bids',
                        include: [
                            {
                                model: Project,
                                as: 'project',
                                include: [
                                    {
                                        model: ProjectSkill,
                                        as: 'project_skills',
                                        include: [{ model: Skill, as: 'skill' }],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        model: Message,
                        as: 'sendMessage',
                        include: [
                            { model: User, as: 'receiver' },
                            { model: Project, as: 'project' },
                        ],
                    },
                    {
                        model: Message,
                        as: 'receivedMessage',
                        include: [
                            { model: User, as: 'sender' },
                            { model: Project, as: 'project' },
                        ],
                    },
                ],
            });
        },
    },

    Mutation: {
        createUser: async (_: unknown, { data }: CreateUserArgs) => {
            return await User.create(data);
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
