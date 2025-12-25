import { Type, Static } from '@sinclair/typebox';
import { ROLES } from '../../models/User';

export const UserSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    name: Type.String({ minLength: 2, maxLength: 50 }),
    email: Type.String({ format: 'email' }),
    role: Type.Enum(ROLES),
});

export const CreateUserSchema = Type.Pick(UserSchema, ['name', 'email', 'role']);
export const UpdateUserSchema = Type.Partial(CreateUserSchema);

export type CreateUserInput = Static<typeof CreateUserSchema>;
export type UpdateUserInput = Static<typeof UpdateUserSchema>;
