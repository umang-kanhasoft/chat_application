import { CreateUserSkillInput, UpdateUserSkillInput } from '../../graphql/schema/userSkill';
import Skill from '../../models/Skill';
import UserSkill from '../../models/UserSkill';

interface CreateUserSkillArgs {
    data: CreateUserSkillInput;
}

interface UpdateUserSkillArgs {
    id: string;
    data: UpdateUserSkillInput;
}

interface UserSkillsByUserIdArgs {
    user_id: string;
}

export default {
    Query: {
        userSkill: async (_: unknown, { id }: { id: string }) => {
            return await UserSkill.findByPk(id);
        },
        userSkillsByUserId: async (_: unknown, { user_id }: UserSkillsByUserIdArgs) => {
            return await UserSkill.findAll({ where: { user_id } });
        },
    },

    UserSkill: {
        skill: async (userSkill: UserSkill) => {
            return await Skill.findByPk(userSkill.skill_id);
        },
    },

    Mutation: {
        createUserSkill: async (_: unknown, { data }: CreateUserSkillArgs) => {
            return await UserSkill.create(data);
        },
        updateUserSkill: async (_: unknown, { id, data }: UpdateUserSkillArgs) => {
            const userSkill = await UserSkill.findByPk(id);
            if (!userSkill) {
                throw new Error('User skill not found');
            }
            await userSkill.update(data);
            return userSkill;
        },
        deleteUserSkill: async (_: unknown, { user_id, skill_id }: { user_id: string; skill_id: string }) => {
            const result = await UserSkill.destroy({
                where: { user_id, skill_id },
            });
            return result > 0;
        },
    },
};
