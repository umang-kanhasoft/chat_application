import { Type, Static } from '@sinclair/typebox';
import { SKILL_LEVEL } from '../../models/UserSkill';

export const userSkillSchema = Type.Object({
    user_id: Type.String({ format: 'uuid' }),
    skill_id: Type.String({ format: 'uuid' }),
    years_of_experience: Type.Integer({ minimum: 0, maximum: 50 }),
    level: Type.Enum(SKILL_LEVEL),
});

export const CreateUserSkillSchema = userSkillSchema;
export const UpdateUserSkillSchema = Type.Partial(CreateUserSkillSchema);

export type CreateUserSkillInput = Static<typeof CreateUserSkillSchema>;
export type UpdateUserSkillInput = Static<typeof UpdateUserSkillSchema>;
