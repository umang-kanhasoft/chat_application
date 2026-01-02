export const WEBRTC_ICE_SERVERS: RTCIceServer[] = (() => {
    const raw = import.meta.env.VITE_WEBRTC_ICE_SERVERS as string | undefined;
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed as RTCIceServer[];
            }
        } catch {
            return [{ urls: ['stun:stun.l.google.com:19302'] }];
        }
    }

    return [{ urls: ['stun:stun.l.google.com:19302'] }];
})();

export const TYPING_CONFIG = {
    // WebSocket configuration
    WS: {
        RECONNECT_INTERVAL: 3000,
        MAX_RECONNECT_ATTEMPTS: 10,
        HEARTBEAT_INTERVAL: 30000,
        MESSAGE_QUEUE_MAX_SIZE: 100,
    },

    // Chat configuration
    CHAT: {
        MESSAGES_PER_PAGE: 50,
        TYPING_TIMEOUT: 1000,
        TYPING_DEBOUNCE: 500,
        MESSAGE_MAX_LENGTH: 5000,
    },

    // UI configuration
    UI: {
        TOAST_DURATION: 3000,
        ANIMATION_DURATION: 300,
    },
} as const;

export const DEFAULT_SKILL_NAMES = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Express',
    'GraphQL',
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Docker',
    'AWS',
    'HTML',
    'CSS',
    'Tailwind CSS',
    'UI/UX Design',
    'Figma',
    'Python',
    'Django',
    'Java',
    'Spring Boot',
] as const;

// Helper to potential extra quotes/commas from env vars (common copy-paste error)
const clean = (val: string | undefined) => (val ? val.replace(/["',]/g, '').trim() : undefined);

export const config = {
    apiURL: import.meta.env.VITE_API_URL,
    webSocketURL: import.meta.env.VITE_WS_URL,
    firebase: {
        apiKey: clean(import.meta.env.VITE_API_KEY),
        authDomain: clean(import.meta.env.VITE_AUTH_DOMAIN),
        projectId: clean(import.meta.env.VITE_PROJECT_ID),
        storageBucket: clean(import.meta.env.VITE_STORAGE_BUCKET),
        messagingSenderId: clean(import.meta.env.VITE_MESSAGING_SENDER_ID),
        appId: clean(import.meta.env.VITE_APP_ID),
        measurementId: clean(import.meta.env.VITE_MEASUREMENT_ID),
        vapidKey: clean(import.meta.env.VITE_VAPID_KEY),
    },
};

export const WS_URL = config.webSocketURL;
