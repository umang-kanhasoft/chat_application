import { create } from 'zustand';


const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

const getApiBaseUrl = () => {
    const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
    return raw ? normalizeBaseUrl(raw) : '';
};

interface AuthState {
    currentUserId: string | null;
    currentUserName: string | null;
    isAuthenticated: boolean;
    accessToken: string | null;
    hasHydrated: boolean;
    setHasHydrated: (value: boolean) => void;
    setUser: (userId: string, userName: string) => void;
    setAccessToken: (token: string | null) => void;
    setOAuthSession: (userId: string, userName: string, accessToken: string) => void;
    refreshAccessToken: () => Promise<boolean>;
    initializeAuth: () => Promise<void>;
    clearUser: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
    currentUserId: null,
    currentUserName: null,
    isAuthenticated: false,
    accessToken: null,
    hasHydrated: false,

    setHasHydrated: (value) => set({ hasHydrated: value }),

    setUser: (userId, userName) =>
        set({
            currentUserId: userId,
            currentUserName: userName,
            isAuthenticated: true,
        }),

    setAccessToken: (token) => set({ accessToken: token }),

    setOAuthSession: (userId, userName, accessToken) =>
        set({
            currentUserId: userId,
            currentUserName: userName,
            isAuthenticated: true,
            accessToken,
        }),

    refreshAccessToken: async () => {
        try {
            const base = getApiBaseUrl();
            const url = base ? `${base}/auth/refresh` : '/auth/refresh';

            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) {
                set({ accessToken: null, isAuthenticated: false, currentUserId: null, currentUserName: null });
                return false;
            }

            const data = (await res.json()) as { accessToken?: string; user?: { id: string; name: string } };
            if (!data?.accessToken || !data.user) {
                set({ accessToken: null, isAuthenticated: false, currentUserId: null, currentUserName: null });
                return false;
            }

            set({
                accessToken: data.accessToken,
                isAuthenticated: true,
                currentUserId: data.user.id,
                currentUserName: data.user.name,
            });
            return true;
        } catch {
            set({ accessToken: null, isAuthenticated: false, currentUserId: null, currentUserName: null });
            return false;
        }
    },

    initializeAuth: async () => {
        const state = get();
        // If we already have token, we are good (e.g. from OAuth redirect)
        if (state.accessToken && state.isAuthenticated) return;

        // Otherwise try to refresh
        await state.refreshAccessToken();
        set({ hasHydrated: true });
    },

    clearUser: () =>
        set({
            currentUserId: null,
            currentUserName: null,
            isAuthenticated: false,
            accessToken: null,
        }),
}));
