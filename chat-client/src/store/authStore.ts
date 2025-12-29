import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/chat.types';

interface AuthState {
  currentUserId: string | null;
  currentUserName: string | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  setUser: (userId: string, userName: string) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUserId: null,
      currentUserName: null,
      currentUser: null,
      isAuthenticated: false,

      setUser: (userId, userName) =>
        set({
          currentUserId: userId,
          currentUserName: userName,
          currentUser: { id: userId, name: userName, role: '', isOnline: true },
          isAuthenticated: true,
        }),

      clearUser: () =>
        set({
          currentUserId: null,
          currentUserName: null,
          currentUser: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'chat-auth-storage',
    }
  )
);
