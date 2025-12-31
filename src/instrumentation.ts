import { logger } from './config/logger';
import { initSentry } from './config/sentry';
import { initTelemetry } from './config/telemetry';

initTelemetry();
initSentry();

process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'unhandledRejection');
});

process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'uncaughtException');
});
