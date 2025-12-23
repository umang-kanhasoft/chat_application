import { ApolloServer } from '@apollo/server';
import { fastifyApolloDrainPlugin, fastifyApolloHandler } from '@as-integrations/fastify';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeResolvers } from '@graphql-tools/merge';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { join } from 'node:path';
import { formatError } from './errorFormatter';

const typeDefs = loadFilesSync(join(__dirname, '../graphql/types/**.*'));
const resolversArray = loadFilesSync(join(__dirname, '../modules/**/*.resolvers.*'));
const resolvers = mergeResolvers(resolversArray);

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
