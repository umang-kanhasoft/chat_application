import { Static, Type } from '@sinclair/typebox';
import { PROJECT_STATUS } from '../../models/Project';

export const projectSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    title: Type.String({ minLength: 2, maxLength: 100 }),
    description: Type.String({ minLength: 2, maxLength: 500 }),
    budget: Type.Integer({ minimum: 0, maximum: 50000 }),
    status: Type.Enum(PROJECT_STATUS),
    client_id: Type.String({ format: 'uuid' }),
    accepted_bid_id: Type.Optional(Type.String({ format: 'uuid' })),
});

export const CreateProjectSchema = Type.Pick(projectSchema, [
    'title',
    'description',
    'budget',
    'status',
    'client_id',
]);

export const UpdateProjectSchema = Type.Partial(CreateProjectSchema);

export type CreateProjectInput = Static<typeof CreateProjectSchema>;
export type UpdateProjectInput = Static<typeof UpdateProjectSchema>;
