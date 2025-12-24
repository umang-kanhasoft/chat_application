import { FastifyReply, FastifyRequest } from 'fastify';
import status from 'http-status';
import { CreateSkillInput, UpdateSkillInput } from '../../graphql/schema/skill';
import { ParamsId } from '../../utils/schema';
import { SkillService } from './service';

export const getSkills = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = await SkillService.getAll();
    return { message: 'Skills fetched successfully.', data };
};

export const getSkillById = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as ParamsId;
    const data = await SkillService.getById(id);
    reply.code(status.OK).send({ message: 'Skill fetched successfully.', data });
    // return { message: 'Skill fetched successfully.', data };
};

export const createSkill = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = await SkillService.create(req.body as CreateSkillInput);
    return { message: 'Skill created successfully.', data };
};

export const updateSkill = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as ParamsId;
    const data = await SkillService.update(id, req.body as UpdateSkillInput);
    return { message: 'Skill updated successfully.', data };
};
