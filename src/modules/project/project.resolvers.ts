import { CreateProjectInput, UpdateProjectInput } from '../../graphql/schema/project';
import Bid from '../../models/Bid';
import Project from '../../models/Project';
import ProjectSkill from '../../models/ProjectSkill';
import Skill from '../../models/Skill';
import User, { ROLES } from '../../models/User';
import UserSkill from '../../models/UserSkill';

export default {
    Query: {
        projects: async () => {
            return await Project.findAll();
        },
        project: async (_: any, { id }: { id: string }) => {
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
        createProject: async (_: any, { data }: { data: CreateProjectInput }) => {
            const client = await User.findByPk(data.client_id);
            if (!client || ![ROLES.CLIENT, ROLES.BOTH].includes(client.role)) {
                throw new Error('Client not found');
            }
            return await Project.create(data);
        },
        updateProject: async (_: any, { id, data }: { id: string; data: UpdateProjectInput }) => {
            const client = await User.findByPk(data.client_id);
            if (!client || client.role !== ROLES.CLIENT) {
                throw new Error('Client not found');
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
