export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

export const CONFIG = {
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
