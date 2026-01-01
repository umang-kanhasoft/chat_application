import { CreateProjectInput, UpdateProjectInput } from '../../graphql/schema/project';
import Bid from '../../models/Bid';
import Project from '../../models/Project';
import ProjectSkill from '../../models/ProjectSkill';
import Skill from '../../models/Skill';
import User, { ROLES } from '../../models/User';
import toIsoString from '../../utils/convertDate';

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
            return await Project.findByPk(id);
        },
    },

    Project: {
        project_skills: async (project: Project) => {
            return await ProjectSkill.findAll({
                where: { project_id: project.id },
                include: [{ model: Skill, as: 'skill' }],
            });
        },
        bids: async (project: Project) => {
            return await Bid.findAll({ where: { project_id: project.id } });
        },
        createdAt: (project: Project) => toIsoString(project.createdAt),
        updatedAt: (project: Project) => toIsoString(project.updatedAt),
    },

    Mutation: {
        createProject: async (_: unknown, { data }: CreateProjectArgs) => {
            const client = await User.findByPk(data.client_id);
            if (!client) {
                throw new Error('Client not found');
            }

            if (client.role === ROLES.USER) {
                await client.update({ role: ROLES.CLIENT });
            } else if (client.role === ROLES.FREELANCER) {
                await client.update({ role: ROLES.BOTH });
            }
            return await Project.create(data);
        },
        updateProject: async (_: unknown, { id, data }: UpdateProjectArgs) => {
            if (data.client_id) {
                const client = await User.findByPk(data.client_id);
                if (!client) {
                    throw new Error('Client not found');
                }

                if (client.role === ROLES.USER) {
                    await client.update({ role: ROLES.CLIENT });
                } else if (client.role === ROLES.FREELANCER) {
                    await client.update({ role: ROLES.BOTH });
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
