import { useCallback, useEffect, useRef } from 'react';
import { config } from '../constants/config';
import { wsService } from '../services/websocket.service';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useConnectionStore } from '../store/connectionStore';
import { ConnectionStatus, SocketEventType, type User } from '../types/chat.types';

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

const getApiBaseUrl = () => {
    return config.webSocketURL ? normalizeBaseUrl(config.webSocketURL) : '';
};

export function useWebSocket() {
    const { setUser, clearUser } = useAuthStore();
    const { status, isConnecting, setStatus, setOnlineUsers, setUserStatus } = useConnectionStore();
    const {
        setProjects,
        setProjectUsers,
        incrementUnreadCount,
        setUnreadCount,
        selectedUserId,
        selectedProjectId,
        setUserTyping,
    } = useChatStore();

    // Use refs to store callback references to prevent dependency issues
    const setUserRef = useRef(setUser);
    const clearUserRef = useRef(clearUser);
    const setStatusRef = useRef(setStatus);
    const setOnlineUsersRef = useRef(setOnlineUsers);
    const setUserStatusRef = useRef(setUserStatus);
    const setProjectsRef = useRef(setProjects);
    const setProjectUsersRef = useRef(setProjectUsers);
    const incrementUnreadCountRef = useRef(incrementUnreadCount);
    const setUnreadCountRef = useRef(setUnreadCount);
    const selectedUserIdRef = useRef(selectedUserId);
    const selectedProjectIdRef = useRef(selectedProjectId);
    const setUserTypingRef = useRef(setUserTyping);

    // Update refs when values change
    useEffect(() => {
        setUserRef.current = setUser;
        clearUserRef.current = clearUser;
        setStatusRef.current = setStatus;
        setOnlineUsersRef.current = setOnlineUsers;
        setUserStatusRef.current = setUserStatus;
        setProjectsRef.current = setProjects;
        setProjectUsersRef.current = setProjectUsers;
        incrementUnreadCountRef.current = incrementUnreadCount;
        setUnreadCountRef.current = setUnreadCount;
        selectedUserIdRef.current = selectedUserId;
        selectedProjectIdRef.current = selectedProjectId;
        setUserTypingRef.current = setUserTyping;
    });

    // Connect to WebSocket - stable reference
    const connect = useCallback(async (userId: string) => {
        try {
            await wsService.connect();
            wsService.authenticate(userId);
        } catch (error) {
            console.error('Failed to connect:', error);
        }
    }, []); // Empty deps - function is stable

    // Disconnect from WebSocket - stable reference
    const disconnect = useCallback(() => {
        wsService.disconnect();
        clearUserRef.current();
    }, []); // Empty deps - uses ref

    const logout = useCallback(async () => {
        try {
            const base = getApiBaseUrl();
            const url = base ? `${base}/auth/logout` : '/auth/logout';
            await fetch(url, {
                method: 'POST',
                credentials: 'include',
            });
        } catch {
            // ignore
        } finally {
            wsService.disconnect();
            clearUserRef.current();
        }
    }, []);

    // Load user projects - stable reference
    const loadProjects = useCallback(() => {
        wsService.send({
            type: SocketEventType.GET_USER_PROJECTS,
            payload: {},
        });
    }, []); // Empty deps - function is stable

    // Load global users (no project) - stable reference
    const loadGlobalUsers = useCallback(() => {
        wsService.send({
            type: SocketEventType.GET_GLOBAL_USERS,
            payload: {},
        });
    }, []);

    // Load project users - stable reference
    const loadProjectUsers = useCallback((projectId: string) => {
        wsService.send({
            type: SocketEventType.GET_PROJECT_USERS,
            payload: { projectId },
        });
    }, []); // Empty deps - function is stable

    // Register Device for FCM - stable reference
    const registerDevice = useCallback((token: string) => {
        wsService.send({
            type: SocketEventType.REGISTER_DEVICE,
            payload: { token, platform: 'web' },
        });
    }, []);

    // Set up event handlers - only once
    useEffect(() => {
        // Connection status handler
        const unsubStatus = wsService.onConnectionStatusChange((newStatus) => {
            setStatusRef.current(newStatus);
        });

        // Auth success handler
        const unsubAuthSuccess = wsService.on(SocketEventType.AUTH_SUCCESS, (message) => {
            const { userId, userName } = message.payload;
            setUserRef.current(userId, userName);
            // Load global users and projects immediately after successful auth
            wsService.send({
                type: SocketEventType.GET_GLOBAL_USERS,
                payload: {},
            });
            wsService.send({
                type: SocketEventType.GET_USER_PROJECTS,
                payload: {},
            });
        });

        // Auth failed handler
        const unsubAuthFailed = wsService.on(SocketEventType.AUTH_FAILED, (message) => {
            console.error('Authentication failed:', message.payload);
            wsService.disconnect();
            clearUserRef.current();
        });

        // Online users handler
        const unsubOnlineUsers = wsService.on(SocketEventType.ONLINE_USERS, (message) => {
            setOnlineUsersRef.current(message.payload.users);
        });

        // User online handler
        const unsubUserOnline = wsService.on(SocketEventType.USER_ONLINE, (message) => {
            const { userId } = message.payload;
            setUserStatusRef.current(userId, true);
        });

        // User offline handler
        const unsubUserOffline = wsService.on(SocketEventType.USER_OFFLINE, (message) => {
            const { userId } = message.payload;
            setUserStatusRef.current(userId, false, new Date());
        });

        // User projects handler
        const unsubUserProjects = wsService.on(SocketEventType.USER_PROJECTS, (message) => {
            setProjectsRef.current(message.payload.projects);
        });

        // Global users handler
        const unsubGlobalUsers = wsService.on(SocketEventType.GLOBAL_USERS, (message) => {
            // Only apply global list when no project is selected.
            if (selectedProjectIdRef.current) return;
            setProjectUsersRef.current(message.payload.users);
            message.payload.users.forEach((user: User) => {
                setUserStatusRef.current(user.id, user.isOnline, user.lastSeen);
                if (user.unreadCount !== undefined) {
                    setUnreadCountRef.current(user.id, user.unreadCount);
                }
            });
        });

        // Project users handler
        const unsubProjectUsers = wsService.on(SocketEventType.PROJECT_USERS, (message) => {
            // Only apply if this response matches the currently selected project.
            const responseProjectId = (message.payload?.projectId || null) as string | null;
            const currentProjectId = selectedProjectIdRef.current ?? null;
            if (responseProjectId !== currentProjectId) return;
            setProjectUsersRef.current(message.payload.users);
            // Initialize user statuses and unread counts
            message.payload.users.forEach((user: User) => {
                setUserStatusRef.current(user.id, user.isOnline, user.lastSeen);
                if (user.unreadCount !== undefined) {
                    setUnreadCountRef.current(user.id, user.unreadCount);
                }
            });
        });

        // Typing start handler
        const unsubTypingStart = wsService.on(SocketEventType.TYPING_START, (message) => {
            const { userId } = message.payload;
            const incomingProjectId = (message.payload?.projectId ?? null) as string | null;
            const currentProjectId = selectedProjectIdRef.current ?? null;
            if (incomingProjectId !== currentProjectId) return;
            setUserTypingRef.current(userId, true);
        });

        // Typing stop handler
        const unsubTypingStop = wsService.on(SocketEventType.TYPING_STOP, (message) => {
            const { userId } = message.payload;
            const incomingProjectId = (message.payload?.projectId ?? null) as string | null;
            const currentProjectId = selectedProjectIdRef.current ?? null;
            if (incomingProjectId !== currentProjectId) return;
            setUserTypingRef.current(userId, false);
        });

        // Error handler
        const unsubError = wsService.on(SocketEventType.ERROR, (message) => {
            console.error('Socket error:', message.payload);
        });

        // Cleanup all listeners on unmount
        return () => {
            unsubStatus();
            unsubAuthSuccess();
            unsubAuthFailed();
            unsubOnlineUsers();
            unsubUserOnline();
            unsubUserOffline();
            unsubUserProjects();
            unsubGlobalUsers();
            unsubProjectUsers();
            unsubTypingStart();
            unsubTypingStop();
            unsubError();
        };
    }, []); // Empty deps - setup once, cleanup on unmount

    return {
        connect,
        disconnect,
        logout,
        loadProjects,
        loadGlobalUsers,
        loadProjectUsers,
        registerDevice,
        isConnected: status === ConnectionStatus.CONNECTED,
        isConnecting: isConnecting || status === ConnectionStatus.CONNECTING,
        isReconnecting: status === ConnectionStatus.RECONNECTING,
        connectionStatus: status,
    };
}
