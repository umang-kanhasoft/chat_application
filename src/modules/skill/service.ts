import { CreateSkillInput, UpdateSkillInput } from '../../graphql/schema/skill';
import Skill from '../../models/Skill';

export const SkillService = {
    async getAll() {
        const skills = await Skill.findAll({ attributes: ['id', 'name'] });
        return { skills };
    },

    async getById(id: string) {
        const skill = await Skill.findOne({
            where: {
                id,
            },
            attributes: ['id', 'name'],
        });
        return skill;
    },

    async create(skillData: CreateSkillInput) {
        const skill = await Skill.create(skillData);
        return skill;
    },

    async update(id: string, skillData: UpdateSkillInput) {
        const skill = await Skill.update(skillData, {
            where: {
                id,
            },
        });
        return skill;
    },
};
