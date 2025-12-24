import { CreateSkillInput, UpdateSkillInput } from '../../graphql/schema/skill';
import Skill from '../../models/Skill';

export default {
    Query: {
        skills: async () => {
            return await Skill.findAll();
        },
        skill: async (_: any, { id }: { id: string }) => {
            return await Skill.findByPk(id);
        },
    },

    Mutation: {
        createSkill: async (_: any, { data }: { data: CreateSkillInput }) => {
            return await Skill.create(data);
        },
        updateSkill: async (_: any, { id, data }: { id: string; data: UpdateSkillInput }) => {
            const skill = await Skill.findByPk(id);
            if (!skill) {
                throw new Error('Skill not found');
            }
            await skill.update(data);
            return skill;
        },
    },
};
