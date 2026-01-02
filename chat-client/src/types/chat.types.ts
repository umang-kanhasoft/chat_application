// Socket Event Types matching backend
export const SocketEventType = {
    // Authentication
    AUTH: 'auth',
    AUTH_SUCCESS: 'auth_success',
    AUTH_FAILED: 'auth_failed',

    // Chat
    MESSAGE_SEND: 'message_send',
    MESSAGE_RECEIVED: 'message_received',
    MESSAGE_HISTORY: 'message_history',
    MESSAGE_READ: 'message_read',
    MARK_AS_READ: 'mark_as_read',
    MESSAGE_DELIVERED: 'message_delivered',

    // Project Users
    GET_PROJECT_USERS: 'get_project_users',
    PROJECT_USERS: 'project_users',
    GET_USER_PROJECTS: 'get_user_projects',
    USER_PROJECTS: 'user_projects',

    // Global Users (no project)
    GET_GLOBAL_USERS: 'get_global_users',
    GLOBAL_USERS: 'global_users',

    // Presence
    USER_ONLINE: 'user_online',
    USER_OFFLINE: 'user_offline',
    ONLINE_USERS: 'online_users',

    // Typing
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',

    // Heartbeat
    HEARTBEAT: 'heartbeat',

    // Calls (WebRTC signaling)
    CALL_START: 'call_start',
    CALL_RINGING: 'call_ringing',
    CALL_ACCEPT: 'call_accept',
    CALL_REJECT: 'call_reject',
    CALL_BUSY: 'call_busy',
    CALL_OFFER: 'call_offer',
    CALL_ANSWER: 'call_answer',
    CALL_ICE_CANDIDATE: 'call_ice_candidate',
    CALL_END: 'call_end',

    // Error
    ERROR: 'error',

    // Device Registration
    REGISTER_DEVICE: 'register_device',
} as const;

export type SocketEventType = (typeof SocketEventType)[keyof typeof SocketEventType];

export const MessageStatus = {
    PENDING: 'PENDING',
    SENT: 'SENT',
    DELIVERED: 'DELIVERED',
    READ: 'READ',
} as const;

export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export interface User {
    id: string;
    name: string;
    role: string;
    isOnline: boolean;
    lastSeen?: Date;
    unreadCount?: number;
}

export interface Project {
    id: string;
    title: string;
    status: string;
}

export interface Attachment {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    url: string;
    public_id?: string;
    uploadProgress?: number;
    uploadEtaSeconds?: number | null;
}

export interface Message {
    id: string;
    clientMsgId?: string;
    projectId: string | null;
    sender_id: string;
    receiver_id?: string;
    content: string;
    timestamp: string;
    status: MessageStatus;
    createdAt?: string;
    attachments?: Attachment[];
    uploadProgress?: number;
    uploadEtaSeconds?: number | null;
}

export interface SocketMessage {
    type: SocketEventType;
    payload?: any;
    timestamp?: Date;
}

export const ConnectionStatus = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
} as const;

export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];
