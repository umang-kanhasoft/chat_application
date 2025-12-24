import { Static, Type } from '@sinclair/typebox';

export const MessageSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    content: Type.String({ minLength: 2, maxLength: 50 }),
    sender_id: Type.String({ format: 'uuid' }),
    receiver_id: Type.String({ format: 'uuid' }),
    project_id: Type.String({ format: 'uuid' }),
});

export const CreateMessageSchema = Type.Pick(MessageSchema, [
    'content',
    'sender_id',
    'receiver_id',
    'project_id',
]);
export const UpdateMessageSchema = Type.Partial(CreateMessageSchema);

export type CreateMessageInput = Static<typeof CreateMessageSchema>;
export type UpdateMessageInput = Static<typeof UpdateMessageSchema>;
