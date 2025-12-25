import { CreateUserSkillInput, UpdateUserSkillInput } from '../../graphql/schema/userSkill';
import UserSkill from '../../models/UserSkill';

interface CreateUserSkillArgs {
    data: CreateUserSkillInput;
}

interface UpdateUserSkillArgs {
    id: string;
    data: UpdateUserSkillInput;
}

export default {
    Query: {
        userSkill: async () => {
            return await UserSkill.findAll();
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
    },
};
