import { getLogger } from '../config/logger';
import { CustomError, formatError as baseFormatError } from '../utils/errors';

const log = getLogger('graphql');

export const formatError = (formattedError: any, error: unknown) => {
    const originalError = (error as any)?.originalError;
    if (originalError && !(originalError instanceof CustomError)) {
        log.error({ err: originalError }, 'GraphQL error');
    }
    return baseFormatError(formattedError, error);
};
