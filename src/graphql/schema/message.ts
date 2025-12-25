import { Static, Type } from '@sinclair/typebox';
import { MESSAGE_STATUS } from '../../models/Message';

export const MessageSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    content: Type.String({ minLength: 1 }),
    sender_id: Type.String({ format: 'uuid' }),
    receiver_id: Type.String({ format: 'uuid' }),
    project_id: Type.String({ format: 'uuid' }),
    status: Type.Enum(MESSAGE_STATUS),
});

export const CreateMessageSchema = Type.Pick(MessageSchema, [
    'content',
    'sender_id',
    'receiver_id',
    'project_id',
    'status',
]);
export const UpdateMessageSchema = Type.Partial(CreateMessageSchema);

export type CreateMessageInput = Static<typeof CreateMessageSchema>;
export type UpdateMessageInput = Static<typeof UpdateMessageSchema>;
