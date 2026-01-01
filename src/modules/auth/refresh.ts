import { FastifyPluginAsync } from 'fastify';
import { verifyRefreshToken, createTokens } from '../../utils/tokens';
import { config } from '../../config/config';
import User from '../../models/User';

const refreshRoute: FastifyPluginAsync = async (fastify) => {
    fastify.post('/refresh', async (request, reply) => {
        const token = request.cookies.refreshToken;
        if (!token) return reply.code(401).send({ error: 'No refresh token' });

        const record = await verifyRefreshToken(token);
        if (!record) return reply.code(401).send({ error: 'Invalid refresh token' });

        const user = await User.findByPk(record.userId);
        if (!user) return reply.code(401).send({ error: 'User not found' });

        const { accessToken, refreshToken: newRefresh } = await createTokens(record.userId);
        reply.setCookie('refreshToken', newRefresh, {
            path: '/',
            httpOnly: true,
            secure: config.environment === 'production',
            sameSite: 'lax',
            maxAge: config.jwt.refreshExpires,
        });

        return {
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        };
    });
};

export default refreshRoute;
