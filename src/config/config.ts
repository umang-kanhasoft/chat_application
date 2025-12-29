import 'dotenv/config';

const config = {
    port: Number(process.env.PORT),
    clientURL: process.env.CLIENT_URL!,
    postgres: {
        host: process.env.DB_HOST!,
        port: process.env.DB_PORT!,
        name: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
    },
    jwt: {
        secret: process.env.JWT_SECRET!,
        accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES!,
        refreshExpirationHours: process.env.JWT_REFRESH_EXPIRATION_HOURS!,
        refreshTokenName: process.env.REFRESH_TOKEN_COOKIE_NAME!,
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY!,
        publishedKey: process.env.STRIPE_PUBLISHABLE_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    },
    nodemailer: {
        gmail_id: process.env.GMAIL_USER!,
        gmail_password: process.env.GMAIL_APP_PASSWORD!,
    },
    redis: {
        username: process.env.REDIS_USERNAME!,
        password: process.env.REDIS_PASSWORD!,
        host: process.env.REDIS_HOST!,
        port: Number(process.env.REDIS_PORT),
        redisURL: process.env.REDIS_URL!,
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        apiSecret: process.env.CLOUDINARY_API_SECRET!,
        apiEnvironmentVariable: process.env.API_ENVIRONMENT_VARIABLE!,
    },
    socket: {
        heartbeatInterval: Number(process.env.WS_HEARTBEAT_INTERVAL),
        cors: {
            origin: process.env.CLIENT_URL!,
            credentials: true,
        },
    },
};

export { config };
