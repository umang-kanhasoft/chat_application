import { create } from 'zustand';
import type { Project, User, Message } from '../types/chat.types';

interface ChatState {
    selectedProjectId: string | null;
    selectedUserId: string | null;
    selectedUser: User | null;
    projects: Project[];
    projectUsers: User[];
    unreadCounts: Map<string, number>;
    lastMessageAt: Map<string, number>;
    typingUsers: Set<string>;
    replyingToMessage: Message | null;
    setReplyingToMessage: (message: Message | null) => void;

    isSidebarOpen: boolean;
    setSelectedProject: (projectId: string | null) => void;
    setSelectedUser: (userId: string | null, user: User | null) => void;
    setProjects: (projects: Project[]) => void;
    setProjectUsers: (users: User[]) => void;
    incrementUnreadCount: (userId: string) => void;
    setUnreadCount: (userId: string, count: number) => void;
    clearUnreadCount: (userId: string) => void;
    getUnreadCount: (userId: string) => number;
    bumpLastMessageAt: (userId: string, at?: number) => void;
    getLastMessageAt: (userId: string) => number;
    setUserTyping: (userId: string, isTyping: boolean) => void;
    isUserTyping: (userId: string) => boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    selectedProjectId: null,
    selectedUserId: null,
    selectedUser: null,
    projects: [],
    projectUsers: [],
    unreadCounts: new Map(),
    lastMessageAt: new Map(),
    typingUsers: new Set(),
    replyingToMessage: null,
    isSidebarOpen: true,

    setReplyingToMessage: (message) => set({ replyingToMessage: message }),

    setSelectedProject: (projectId,
        // state type check might fail on implicit any for projectId if not careful, but keeping original style
    ) =>
        set({
            selectedProjectId: projectId,
            selectedUserId: null,
            selectedUser: null,
        }),

    setSelectedUser: (userId, user) =>
        set({
            selectedUserId: userId,
            selectedUser: user,
        }),

    setProjects: (projects) => set({ projects }),

    setProjectUsers: (users) => set({ projectUsers: users }),

    incrementUnreadCount: (userId) =>
        set((state) => {
            const newCounts = new Map(state.unreadCounts);
            const current = newCounts.get(userId) || 0;
            newCounts.set(userId, current + 1);
            return { unreadCounts: newCounts };
        }),

    setUnreadCount: (userId, count) =>
        set((state) => {
            const newCounts = new Map(state.unreadCounts);
            if (count > 0) {
                newCounts.set(userId, count);
            } else {
                newCounts.delete(userId);
            }
            return { unreadCounts: newCounts };
        }),

    clearUnreadCount: (userId) =>
        set((state) => {
            const newCounts = new Map(state.unreadCounts);
            newCounts.delete(userId);
            return { unreadCounts: newCounts };
        }),

    getUnreadCount: (userId) => get().unreadCounts.get(userId) || 0,

    bumpLastMessageAt: (userId, at) =>
        set((state) => {
            const next = new Map(state.lastMessageAt);
            const ts = typeof at === 'number' && Number.isFinite(at) ? at : Date.now();
            const prev = next.get(userId) || 0;
            if (ts > prev) {
                next.set(userId, ts);
            }
            return { lastMessageAt: next };
        }),

    getLastMessageAt: (userId) => get().lastMessageAt.get(userId) || 0,

    setUserTyping: (userId, isTyping) =>
        set((state) => {
            const newTypingUsers = new Set(state.typingUsers);
            if (isTyping) {
                newTypingUsers.add(userId);
            } else {
                newTypingUsers.delete(userId);
            }
            return { typingUsers: newTypingUsers };
        }),

    isUserTyping: (userId) => get().typingUsers.has(userId),

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
