import { Static, Type } from '@sinclair/typebox';

export const ParamsSchema = Type.Object({ id: Type.String({ format: 'uuid' }) });

export type ParamsId = Static<typeof ParamsSchema>;
