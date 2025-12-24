import {
    CreateProjectSkillInput,
    UpdateProjectSkillInput,
} from '../../graphql/schema/projectSkill';
import ProjectSkill from '../../models/ProjectSkill';
import Skill from '../../models/Skill';
import Project from '../../models/Project';

export default {
    Query: {
        projectSkill: async () => {
            return await ProjectSkill.findAll();
        },
    },

    Mutation: {
        createProjectSkill: async (_: any, { data }: { data: CreateProjectSkillInput }) => {
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
        updateProjectSkill: async (
            _: any,
            { id, data }: { id: string; data: UpdateProjectSkillInput },
        ) => {
            const projectSkill = await ProjectSkill.findByPk(id);
            if (!projectSkill) {
                throw new Error('Project skill not found');
            }
            await projectSkill.update(data);
            return projectSkill;
        },
    },
};
