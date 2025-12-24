import { Static, Type } from '@sinclair/typebox';
import { BID_STATUS } from '../../models/Bid';

export const bidSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    amount: Type.Integer({ minimum: 0, maximum: 50000 }),
    status: Type.Enum(BID_STATUS),
    user_id: Type.String({ format: 'uuid' }),
    project_id: Type.String({ format: 'uuid' }),
});

export const CreateBidSchema = Type.Pick(bidSchema, ['amount', 'status', 'user_id', 'project_id']);

export const UpdateBidSchema = Type.Partial(CreateBidSchema);

export type CreateBidInput = Static<typeof CreateBidSchema>;
export type UpdateBidInput = Static<typeof UpdateBidSchema>;
