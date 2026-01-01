import oauthPlugin from '@fastify/oauth2';
import { FastifyPluginAsync } from 'fastify';
import { config } from '../../config/config';
import User, { ROLES } from '../../models/User';
import { createTokens, verifyRefreshToken } from '../../utils/tokens';
import { authMiddleware } from './middleware';

type GoogleUserInfo = {
    email?: string;
    name?: string;
};

const authRoutes: FastifyPluginAsync = async (fastify) => {
    await fastify.register(oauthPlugin, {
        name: 'googleOAuth2',
        scope: ['profile', 'email'],
        credentials: {
            client: {
                id: config.google.clientId,
                secret: config.google.clientSecret,
            },
            auth: oauthPlugin.GOOGLE_CONFIGURATION,
        },
        callbackUri: (req) => {
            const baseUrl =
                config.serverURL || `${req.protocol}://${String(req.headers.host || '')}`;
            return `${baseUrl.replace(/\/+$/, '')}/auth/google/callback`;
        },
        callbackUriParams: {
            access_type: 'offline',
        },
        pkce: 'S256',
    });

    fastify.get('/google', async (request, reply) => {
        try {
            if (!config.google.clientId || !config.google.clientSecret) {
                return reply.code(500).send({
                    error: 'Google OAuth is not configured (CLIENT_ID / CLIENT_SECRET missing)',
                });
            }

            return (fastify as any).googleOAuth2.generateAuthorizationUri(
                request,
                reply,
                (err: unknown, authorizationEndpoint: string) => {
                    if (err) {
                        return reply.code(500).send({ error: 'Failed to start Google OAuth flow' });
                    }
                    return reply.redirect(authorizationEndpoint);
                },
            );
        } catch {
            return reply.code(500).send({ error: 'Failed to start Google OAuth flow' });
        }
    });

    fastify.get('/google/callback', async (request, reply) => {
        try {
            const { token } = await (
                fastify as any
            ).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

            const userInfoResponse = await globalThis.fetch(
                'https://www.googleapis.com/oauth2/v2/userinfo?alt=json',
                {
                    headers: {
                        Authorization: `Bearer ${token.access_token}`,
                    },
                },
            );

            if (!userInfoResponse.ok) {
                throw new Error(`Failed to fetch user profile (${userInfoResponse.status})`);
            }

            const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;
            const email = userInfo.email?.trim().toLowerCase();

            if (!email) {
                throw new Error('Email not provided by OAuth provider');
            }

            const name = userInfo.name?.trim() || email.split('@')[0] || 'User';

            const existingUser = await User.findOne({ where: { email } });

            const user = existingUser
                ? await existingUser.update({ name, lastSeen: new Date() })
                : await User.create({
                      name,
                      email,
                      role: ROLES.USER,
                      lastSeen: new Date(),
                      isOnline: false,
                  });

            const { accessToken, refreshToken } = await createTokens(user.id);
            reply.setCookie('refreshToken', refreshToken, {
                path: '/',
                httpOnly: true,
                secure: config.environment === 'production',
                sameSite: 'lax',
                maxAge: config.jwt.refreshExpires,
            });

            const redirectUrl = new URL(config.clientURL);
            redirectUrl.searchParams.set('userId', user.id);
            redirectUrl.searchParams.set('userName', user.name);
            redirectUrl.searchParams.set('accessToken', accessToken);

            return reply.redirect(redirectUrl.toString());
        } catch (error) {
            const message = error instanceof Error ? error.message : 'OAuth login failed';
            try {
                const redirectUrl = new URL(config.clientURL);
                redirectUrl.searchParams.set('oauthError', message);
                return reply.redirect(redirectUrl.toString());
            } catch {
                return reply.code(500).send({ error: message });
            }
        }
    });

    fastify.post('/logout', async (request, reply) => {
        const token = request.cookies.refreshToken;
        if (token) {
            const record = await verifyRefreshToken(token);
            if (record) {
                await record.destroy();
            }
        }

        reply.clearCookie('refreshToken', { path: '/' });
        return { success: true };
    });

    fastify.get('/me', { preValidation: [authMiddleware] }, async (request, reply) => {
        const userId = (request as any).userId as string | undefined;
        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    });
};

export default authRoutes;
