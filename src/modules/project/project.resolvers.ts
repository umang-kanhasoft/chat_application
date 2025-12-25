import { CreateProjectInput, UpdateProjectInput } from '../../graphql/schema/project';
import Bid from '../../models/Bid';
import Project from '../../models/Project';
import ProjectSkill from '../../models/ProjectSkill';
import Skill from '../../models/Skill';
import User, { ROLES } from '../../models/User';
import UserSkill from '../../models/UserSkill';

interface ProjectArgs {
    id: string;
}

interface CreateProjectArgs {
    data: CreateProjectInput;
}

interface UpdateProjectArgs {
    id: string;
    data: UpdateProjectInput;
}

export default {
    Query: {
        projects: async () => {
            return await Project.findAll();
        },
        project: async (_: unknown, { id }: ProjectArgs) => {
            return await Project.findByPk(id, {
                include: [
                    {
                        model: ProjectSkill,
                        as: 'project_skills',
                        include: [
                            {
                                model: Skill,
                                as: 'skill',
                            },
                        ],
                    },
                    {
                        model: Bid,
                        as: 'bids',
                        include: [
                            {
                                model: User,
                                as: 'user',
                                include: [
                                    {
                                        model: UserSkill,
                                        as: 'user_skills',
                                        include: [
                                            {
                                                model: Skill,
                                                as: 'skill',
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        },
    },

    Mutation: {
        createProject: async (_: unknown, { data }: CreateProjectArgs) => {
            const client = await User.findByPk(data.client_id);
            if (!client || ![ROLES.CLIENT, ROLES.BOTH].includes(client.role)) {
                throw new Error('Client not found');
            }
            return await Project.create(data);
        },
        updateProject: async (_: unknown, { id, data }: UpdateProjectArgs) => {
            if (data.client_id) {
                const client = await User.findByPk(data.client_id);
                if (!client || client.role !== ROLES.CLIENT) {
                    throw new Error('Client not found');
                }
            }
            const project = await Project.findByPk(id);
            if (!project) {
                throw new Error('Project not found');
            }
            await project.update(data);
            return project;
        },
    },
};
