import fp from 'fastify-plugin';

export default fp(async (fastify) => {
    fastify.addHook('preValidation', async (req, reply) => {
        const body = (req as any).body;
        if (!body || typeof body !== 'object') return;

        const content = (body as any).content;
        if (typeof content === 'string' && content.length > 4000) {
            return reply.code(400).send({ error: 'Message too long' });
        }
    });
});
