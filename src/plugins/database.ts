import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import sequelize from '../config/sequalize';
import models from '../models';

declare module 'fastify' {
    interface FastifyInstance {
        db: {
            sequelize: typeof sequelize;
            models: typeof models;
        };
    }
}

const databasePlugin: FastifyPluginAsync = async (fastify) => {
    try {
        await sequelize.authenticate();
        fastify.log.info('Database connection established successfully.');

        // await sequelize.sync({ alter: true });
        // fastify.log.info('Database synchronized successfully.');

        fastify.decorate('db', {
            sequelize,
            models,
        });

        sequelize.addHook('afterConnect', () => {
            fastify.log.info('Database pool connection established');
        });
    } catch (error) {
        if (typeof error === 'string') {
            fastify.log.error('Unable to connect to the database:', error as never);
        }

        throw error;
    }
};

export default fp(databasePlugin);
