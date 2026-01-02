import { ApolloServer } from '@apollo/server';
import { fastifyApolloDrainPlugin, fastifyApolloHandler } from '@as-integrations/fastify';
import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { typeDefs as bidTypeDefs } from '../graphql/types/bid.graphql';
import { typeDefs as messageTypeDefs } from '../graphql/types/message.graphql';
import { typeDefs as projectTypeDefs } from '../graphql/types/project.graphql';
import { typeDefs as projectSkillTypeDefs } from '../graphql/types/projectSkill.graphql';
import { typeDefs as skillTypeDefs } from '../graphql/types/skill.graphql';
import { typeDefs as userTypeDefs } from '../graphql/types/user.graphql';
import { typeDefs as userSkillTypeDefs } from '../graphql/types/userSkill.graphql';
import { authMiddleware } from '../modules/auth/middleware';
import bidResolvers from '../modules/bid/bid.resolvers';
import messageResolvers from '../modules/message/message.resolvers';
import projectResolvers from '../modules/project/project.resolvers';
import projectSkillResolvers from '../modules/projectSkill/projectSkill.resolvers';
import skillResolvers from '../modules/skill/skill.resolvers';
import userResolvers from '../modules/user/user.resolvers';
import userSkillResolvers from '../modules/userSkill/userSkill.resolvers';
import { formatError } from './errorFormatter';

const typeDefs = mergeTypeDefs([
    bidTypeDefs,
    messageTypeDefs,
    projectTypeDefs,
    projectSkillTypeDefs,
    skillTypeDefs,
    userTypeDefs,
    userSkillTypeDefs,
]);

const resolvers = mergeResolvers([
    bidResolvers,
    messageResolvers,
    projectResolvers,
    projectSkillResolvers,
    skillResolvers,
    userResolvers,
    userSkillResolvers,
]);

const startGraphQL: FastifyPluginAsync = async (fastify) => {
    try {
        const server = new ApolloServer({
            typeDefs,
            resolvers,
            formatError,
            plugins: [fastifyApolloDrainPlugin(fastify)],
        });

        await server.start();

        // Register the /graphql route
        fastify.route({
            url: '/graphql',
            method: ['GET', 'POST', 'OPTIONS'],
            preValidation: [authMiddleware],
            handler: fastifyApolloHandler(server, {
                // Access your Sequelize models or User from the request
                context: async (request) => ({
                    user: (request as any).user, // If using fastify-jwt
                    db: fastify.db, // If you registered sequelize as a plugin
                }),
            }),
        });
    } catch (error) {
        if (typeof error === 'string') {
            fastify.log.error('Unable to connect to the database:', error as never);
        }

        throw error;
    }
};

export default fp(startGraphQL);
