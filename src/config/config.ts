import 'dotenv/config';

const getNumber = (value: string | undefined, fallback?: number) => {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const config = {
    port: Number(process.env.PORT || 4000),
    serverURL: (process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || '').replace(
        /\/+$/,
        '',
    ),
    clientURL: process.env.CLIENT_URL!,
    environment: process.env.NODE_ENV!,
    postgres: {
        host: process.env.DB_HOST!,
        port: process.env.DB_PORT!,
        name: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
    },
    jwt: {
        secret: process.env.JWT_SECRET!,
        accessExpires:
            (getNumber(process.env.JWT_ACCESS_EXPIRES, undefined) ??
                getNumber(process.env.JWT_ACCESS_EXPIRATION_MINUTES, 60)) * 60,
        refreshExpires:
            (getNumber(process.env.JWT_REFRESH_EXPIRES, undefined) ??
                getNumber(process.env.JWT_REFRESH_EXPIRATION_HOURS, 24)) *
            60 *
            60,
    },
    cors: {
        corsOrigin: process.env.CORS_ORIGIN || process.env.CLIENT_URL || '',
    },
    redis: {
        username: process.env.REDIS_USERNAME!,
        password: process.env.REDIS_PASSWORD!,
        host: process.env.REDIS_HOST!,
        port: Number(process.env.REDIS_PORT),
        url: process.env.REDIS_URL!,
    },
    firebase: {
        type: process.env.FIREBASE_TYPE!,
        project_id: process.env.FIREBASE_PROJECT_ID!,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
        private_key: process.env.FIREBASE_PRIVATE_KEY!,
        client_email: process.env.FIREBASE_CLIENT_EMAIL!,
        client_id: process.env.FIREBASE_CLIENT_ID!,
        auth_uri: process.env.FIREBASE_AUTH_URI!,
        token_uri: process.env.FIREBASE_TOKEN_URI!,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL!,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL!,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN!,
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        apiSecret: process.env.CLOUDINARY_API_SECRET!,
        apiEnvironmentVariable: process.env.API_ENVIRONMENT_VARIABLE!,
    },
    google: {
        clientId: process.env.CLIENT_ID!,
        clientSecret: process.env.CLIENT_SECRET!,
    },
    socket: {
        heartbeatInterval: Number(process.env.WS_HEARTBEAT_INTERVAL),
        cors: {
            origin: process.env.CLIENT_URL!,
            credentials: true,
        },
    },
    otel: {
        endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
        serviceName: process.env.OTEL_SERVICE_NAME || 'freelance-platform',
        serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
        metricExportInterval: Number(process.env.OTEL_METRIC_EXPORT_INTERVAL || 60000),
    },
    sentry: {
        dsn: process.env.SENTRY_DSN,
        logInit: process.env.SENTRY_LOG_INIT === 'true',
    },
};

export { config };
