export const WS_URL = import.meta.env.VITE_WS_URL;

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
