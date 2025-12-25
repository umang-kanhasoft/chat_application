import { WebSocket } from 'ws';

export interface AuthenticatedSocket extends WebSocket {
    userId?: string;
    userName?: string;
    isAlive?: boolean;
}

export enum SocketEventType {
    // Authentication
    AUTH = 'auth',
    AUTH_SUCCESS = 'auth_success',
    AUTH_FAILED = 'auth_failed',

    // Chat
    MESSAGE_SEND = 'message_send',
    MESSAGE_RECEIVED = 'message_received',
    MESSAGE_HISTORY = 'message_history',
    MESSAGE_READ = 'message_read',
    MARK_AS_READ = 'mark_as_read',

    // Project Users
    GET_PROJECT_USERS = 'get_project_users',
    PROJECT_USERS = 'project_users',
    GET_USER_PROJECTS = 'get_user_projects',
    USER_PROJECTS = 'user_projects',

    // Presence
    USER_ONLINE = 'user_online',
    USER_OFFLINE = 'user_offline',
    ONLINE_USERS = 'online_users',

    // Error
    ERROR = 'error',
}

export interface SocketMessage {
    type: SocketEventType;
    payload?: any;
    timestamp?: Date;
}
