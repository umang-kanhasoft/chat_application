import { GraphQLFormattedError } from 'graphql';
import { CustomError } from '../utils/errors';

export const formatError = (
    formattedError: GraphQLFormattedError,
    error: unknown,
): GraphQLFormattedError => {
    const originalError = (error as any)?.originalError;

    if (originalError instanceof CustomError) {
        return {
            ...formattedError,
            message: originalError.message,
            extensions: { code: originalError.statusCode },
        };
    }

    if (originalError?.name === 'SequelizeValidationError') {
        return {
            ...formattedError,
            message: originalError.errors[0].message,
            extensions: { code: 'BAD_REQUEST' },
        };
    }

    if (originalError?.name === 'SequelizeUniqueConstraintError') {
        return {
            ...formattedError,
            message: 'Email already exists',
            extensions: { code: 'CONFLICT' },
        };
    }

    return formattedError;
};
