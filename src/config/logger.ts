import pino, { LoggerOptions } from 'pino';
import { config } from './config';

const isProduction = config.environment === 'production';

const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

const loggerOptions: LoggerOptions = {
    level,
    base: {
        service: config.otel.serviceName,
        serviceVersion: config.otel.serviceVersion,
        environment: config.environment,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["set-cookie"]',
            'authorization',
            'cookie',
            'password',
            '*.password',
            'token',
            '*.token',
            'accessToken',
            '*.accessToken',
            'refreshToken',
            '*.refreshToken',
        ],
        remove: true,
    },
    serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err,
    },
};

if (!isProduction) {
    loggerOptions.transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: false,
        },
    };
}

export const logger = pino(loggerOptions);

export const getLogger = (component: string) => logger.child({ component });
