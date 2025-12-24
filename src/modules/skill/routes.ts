import { FastifyPluginAsync } from 'fastify';
import { CreateSkillSchema, SkillSchema, UpdateSkillSchema } from '../../graphql/schema/skill';
import { ParamsSchema } from '../../utils/schema';
import { createSkill, getSkillById, getSkills, updateSkill } from './controller';

const skill: FastifyPluginAsync = async (fastify): Promise<void> => {
    // Get all skills
    fastify.get('/', getSkills);

    // Get skill by id
    fastify.get('/:id', getSkillById);

    // Create skill
    fastify.post(
        '/',
        {
            schema: {
                body: CreateSkillSchema,
                response: { 201: SkillSchema },
            },
        },
        createSkill,
    );

    // Update skill
    fastify.patch(
        '/:id',
        {
            schema: {
                body: UpdateSkillSchema,
                params: ParamsSchema,
            },
        },
        updateSkill,
    );
};

export default skill;
