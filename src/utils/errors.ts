import { FastifyReply } from 'fastify';
import { GraphQLError } from 'graphql';

export class CustomError extends Error {
    constructor(
        public statusCode: number,
        message: string,
    ) {
        super(message);
        this.name = 'CustomError';
    }
}

export const throwError = (statusCode: number, message: string): never => {
    throw new CustomError(statusCode, message);
};

export const handleError = (error: any, reply: FastifyReply) => {
    if (error instanceof CustomError) {
        return reply.status(error.statusCode).send({ error: error.message });
    }

    if (error.name === 'SequelizeValidationError') {
        return reply.status(400).send({ error: error.errors[0].message });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(409).send({ error: 'Email already exists' });
    }
    console.log({ error });
    reply.status(500).send({ error: 'Internal server error' });
};

export const handleGraphQLError = (error: any): never => {
    if (error instanceof CustomError) {
        throw new GraphQLError(error.message, { extensions: { code: error.statusCode } });
    }

    if (error.name === 'SequelizeValidationError') {
        throw new GraphQLError(error.errors[0].message, { extensions: { code: 'BAD_REQUEST' } });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
        throw new GraphQLError('Email already exists', { extensions: { code: 'CONFLICT' } });
    }

    throw new GraphQLError('Internal server error', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
};
