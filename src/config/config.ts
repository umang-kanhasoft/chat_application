import 'dotenv/config';

const config = {
    port: Number(process.env.PORT || 4000),
    serverURL: (process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || '').replace(
        /\/+$/,
        '',
    ),
    clientURL: process.env.CLIENT_URL!,
    environment: process.env.NODE_ENV!,
    otel: {
        endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
        serviceName: process.env.OTEL_SERVICE_NAME || 'freelance-platform',
        serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
        metricExportInterval: Number(process.env.OTEL_METRIC_EXPORT_INTERVAL || 60000),
    },
    cors: {
        corsOrigin: process.env.CORS_ORIGIN || process.env.CLIENT_URL || '',
    },
    google: {
        clientId: process.env.CLIENT_ID!,
        clientSecret: process.env.CLIENT_SECRET!,
    },
    postgres: {
        host: process.env.DB_HOST!,
        port: process.env.DB_PORT!,
        name: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
    },
    redis: {
        username: process.env.REDIS_USERNAME!,
        password: process.env.REDIS_PASSWORD!,
        host: process.env.REDIS_HOST!,
        port: Number(process.env.REDIS_PORT),
        url: process.env.REDIS_URL!,
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
    sentry: {
        dsn: process.env.SENTRY_DSN,
        logInit: process.env.SENTRY_LOG_INIT === 'true',
    },
};

export { config };
