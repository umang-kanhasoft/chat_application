import { CreateUserSkillInput, UpdateUserSkillInput } from '../../graphql/schema/userSkill';
import UserSkill from '../../models/UserSkill';

export default {
    Query: {
        userSkill: async () => {
            return await UserSkill.findAll();
        },
    },

    Mutation: {
        createUserSkill: async (_: any, { data }: { data: CreateUserSkillInput }) => {
            return await UserSkill.create(data);
        },
        updateUserSkill: async (
            _: any,
            { id, data }: { id: string; data: UpdateUserSkillInput },
        ) => {
            const userSkill = await UserSkill.findByPk(id);
            if (!userSkill) {
                throw new Error('User skill not found');
            }
            await userSkill.update(data);
            return userSkill;
        },
    },
};
