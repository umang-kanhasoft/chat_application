import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from './config';
import { getLogger } from './logger';

let sentryInitAttempted = false;
const log = getLogger('sentry');

export function initSentry() {
    if (sentryInitAttempted) return;
    sentryInitAttempted = true;

    if (!config.sentry.dsn) {
        log.warn('SENTRY_DSN not configured, skipping Sentry initialization');
        return;
    }

    Sentry.init({
        dsn: config.sentry.dsn,
        environment: config.environment || 'development',
        tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
        integrations: [nodeProfilingIntegration()],
        beforeSend(event, hint) {
            if (config.environment === 'development') {
                log.error(
                    { err: hint.originalException || hint.syntheticException },
                    'Sentry Error',
                );
            }
            return event;
        },
    });
}

export { Sentry };
