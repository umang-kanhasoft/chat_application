import { CreateSkillInput, UpdateSkillInput } from '../../graphql/schema/skill';
import Skill from '../../models/Skill';

interface SkillArgs {
    id: string;
}

interface CreateSkillArgs {
    data: CreateSkillInput;
}

interface UpdateSkillArgs {
    id: string;
    data: UpdateSkillInput;
}

export default {
    Query: {
        skills: async () => {
            return await Skill.findAll();
        },
        skill: async (_: unknown, { id }: SkillArgs) => {
            return await Skill.findByPk(id);
        },
    },

    Mutation: {
        createSkill: async (_: unknown, { data }: CreateSkillArgs) => {
            return await Skill.create(data);
        },
        updateSkill: async (_: unknown, { id, data }: UpdateSkillArgs) => {
            const skill = await Skill.findByPk(id);
            if (!skill) {
                throw new Error('Skill not found');
            }
            await skill.update(data);
            return skill;
        },
    },
};
