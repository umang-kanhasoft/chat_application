import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { fastifyLoggerOptions } from './config/logger';

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
    logger: fastifyLoggerOptions,
    genReqId: () => randomUUID(),
    pluginTimeout: Number(process.env.FASTIFY_PLUGIN_TIMEOUT_MS || 60000),
    trustProxy: true,
};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
    // This loads all plugins
    void fastify.register(AutoLoad, {
        dir: join(__dirname, 'plugins'),
        options: opts,
    });

    // This loads all modules
    void fastify.register(AutoLoad, {
        dir: join(__dirname, 'modules'),
        options: opts,
    });
};

export default app;
export { app, options };
