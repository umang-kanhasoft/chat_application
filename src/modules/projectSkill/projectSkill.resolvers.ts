import {
    CreateProjectSkillInput,
    UpdateProjectSkillInput,
} from '../../graphql/schema/projectSkill';
import ProjectSkill from '../../models/ProjectSkill';
import Skill from '../../models/Skill';
import Project from '../../models/Project';

interface CreateProjectSkillArgs {
    data: CreateProjectSkillInput;
}

interface UpdateProjectSkillArgs {
    id: string;
    data: UpdateProjectSkillInput;
}

export default {
    Query: {
        projectSkill: async () => {
            return await ProjectSkill.findAll();
        },
    },

    Mutation: {
        createProjectSkill: async (_: unknown, { data }: CreateProjectSkillArgs) => {
            const skill = await Skill.findByPk(data.skill_id);
            if (!skill) {
                throw new Error('Skill not found');
            }
            const project = await Project.findByPk(data.project_id);
            if (!project) {
                throw new Error('Project not found');
            }
            return await ProjectSkill.create(data);
        },
        updateProjectSkill: async (_: unknown, { id, data }: UpdateProjectSkillArgs) => {
            const projectSkill = await ProjectSkill.findByPk(id);
            if (!projectSkill) {
                throw new Error('Project skill not found');
            }
            await projectSkill.update(data);
            return projectSkill;
        },
    },
};
