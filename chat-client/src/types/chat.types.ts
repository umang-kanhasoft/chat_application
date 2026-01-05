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

    // Message Reactions
    REACTION_ADDED: 'reaction_added',

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

export type SocketEventPayloadMap = {
    [SocketEventType.AUTH]: { userId: string };
    [SocketEventType.AUTH_SUCCESS]: { userId: string; userName: string };
    [SocketEventType.AUTH_FAILED]: unknown;

    [SocketEventType.MESSAGE_SEND]: {
        clientMsgId?: string;
        receiver_id?: string;
        projectId?: string | null;
        content?: string;
        attachments?: unknown;
        replyToId?: string;
    };
    [SocketEventType.MESSAGE_RECEIVED]: Message;
    [SocketEventType.MESSAGE_HISTORY]:
    | {
        projectId?: string | null;
        receiverId?: string;
        page?: number;
        limit?: number;
    }
    | {
        messages?: Message[];
        page?: number;
        totalPages?: number;
    };
    [SocketEventType.MESSAGE_READ]: { messageIds?: string[] };
    [SocketEventType.MARK_AS_READ]: { messageIds?: string[] };
    [SocketEventType.MESSAGE_DELIVERED]: { messageIds?: string[] };

    [SocketEventType.REACTION_ADDED]: {
        messageId: string;
        reactions: {
            emoji: string;
            count: number;
            userIds: string[];
        }[];
        updatedBy: string;
    };

    [SocketEventType.GET_PROJECT_USERS]: { projectId: string };
    [SocketEventType.PROJECT_USERS]: { projectId?: string | null; users: User[] };
    [SocketEventType.GET_USER_PROJECTS]: Record<string, never>;
    [SocketEventType.USER_PROJECTS]: { projects: Project[] };

    [SocketEventType.GET_GLOBAL_USERS]: Record<string, never>;
    [SocketEventType.GLOBAL_USERS]: { users: User[] };

    [SocketEventType.USER_ONLINE]: { userId: string };
    [SocketEventType.USER_OFFLINE]: { userId: string; lastSeen?: string };
    [SocketEventType.ONLINE_USERS]: { users: string[] };

    [SocketEventType.TYPING_START]: { userId?: string; projectId?: string | null };
    [SocketEventType.TYPING_STOP]: { userId?: string; projectId?: string | null };

    [SocketEventType.HEARTBEAT]: Record<string, never>;

    [SocketEventType.CALL_START]: { callId: string; toUserId: string };
    [SocketEventType.CALL_RINGING]: { callId?: string; fromUserId?: string; fromUserName?: string };
    [SocketEventType.CALL_ACCEPT]: { callId?: string };
    [SocketEventType.CALL_REJECT]: { callId?: string; reason?: string };
    [SocketEventType.CALL_BUSY]: { callId?: string };
    [SocketEventType.CALL_OFFER]: {
        callId?: string;
        fromUserId?: string;
        sdp?: RTCSessionDescriptionInit;
    };
    [SocketEventType.CALL_ANSWER]: {
        callId?: string;
        fromUserId?: string;
        sdp?: RTCSessionDescriptionInit;
    };
    [SocketEventType.CALL_ICE_CANDIDATE]: {
        callId?: string;
        fromUserId?: string;
        candidate?: RTCIceCandidateInit;
    };
    [SocketEventType.CALL_END]: { callId?: string; reason?: string };

    [SocketEventType.ERROR]: unknown;

    [SocketEventType.REGISTER_DEVICE]: { token: string; platform: string };
};

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

export interface Reaction {
    emoji: string;
    count: number;
    userIds: string[];
}

export interface Message {
    id: string;
    clientMsgId?: string;
    projectId: string | null;
    sender_id: string;
    sender?: { name: string; avatar?: string };
    receiver_id?: string;
    content: string;
    timestamp: string;
    status: MessageStatus;
    createdAt?: string;
    attachments?: Attachment[];
    reactions?: Reaction[];
    replyToId?: string;
    replyTo?: {
        id: string;
        content: string;
        sender: { name: string };
    } | null;
    uploadProgress?: number;
    uploadEtaSeconds?: number | null;
}

export type SocketMessage<TType extends SocketEventType = SocketEventType> = {
    type: TType;
    payload: SocketEventPayloadMap[TType];
    timestamp?: Date;
};

export const ConnectionStatus = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
} as const;

export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];
