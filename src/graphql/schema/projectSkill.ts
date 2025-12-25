import { Static, Type } from '@sinclair/typebox';
import { SKILL_LEVEL } from '../../models/UserSkill';

export const ProjectSkillSchema = Type.Object({
    project_id: Type.String({ format: 'uuid' }),
    skill_id: Type.String({ format: 'uuid' }),
    years_of_experience: Type.Integer({ minimum: 0, maximum: 50 }),
    level: Type.Enum(SKILL_LEVEL),
});

export const CreateProjectSkillSchema = ProjectSkillSchema;
export const UpdateProjectSkillSchema = Type.Partial(CreateProjectSkillSchema);

export type CreateProjectSkillInput = Static<typeof CreateProjectSkillSchema>;
export type UpdateProjectSkillInput = Static<typeof UpdateProjectSkillSchema>;
