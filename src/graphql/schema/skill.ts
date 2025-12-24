import { Type, Static } from '@sinclair/typebox';

export const SkillSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    name: Type.String({ minLength: 2, maxLength: 50 }),
});

export const CreateSkillSchema = Type.Pick(SkillSchema, ['name']);
export const UpdateSkillSchema = Type.Partial(CreateSkillSchema);

export type CreateSkillInput = Static<typeof CreateSkillSchema>;
export type UpdateSkillInput = Static<typeof UpdateSkillSchema>;
