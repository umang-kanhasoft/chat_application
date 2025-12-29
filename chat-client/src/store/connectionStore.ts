import { create } from 'zustand';
import { ConnectionStatus } from '../types/chat.types';

interface ConnectionState {
  status: ConnectionStatus;
  isConnecting: boolean;
  onlineUsers: string[];
  userStatuses: Map<string, { isOnline: boolean; lastSeen?: Date }>;
  setStatus: (status: ConnectionStatus) => void;
  setOnlineUsers: (users: string[]) => void;
  setUserStatus: (userId: string, isOnline: boolean, lastSeen?: Date) => void;
  isUserOnline: (userId: string) => boolean;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  status: ConnectionStatus.DISCONNECTED,
  isConnecting: false,
  onlineUsers: [],
  userStatuses: new Map(),

  setStatus: (status) =>
    set({
      status,
      isConnecting:
        status === ConnectionStatus.CONNECTING || status === ConnectionStatus.RECONNECTING,
    }),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  setUserStatus: (userId, isOnline, lastSeen) =>
    set((state) => {
      const newStatuses = new Map(state.userStatuses);
      newStatuses.set(userId, { isOnline, lastSeen });
      return { userStatuses: newStatuses };
    }),

  isUserOnline: (userId) => {
    const status = get().userStatuses.get(userId);
    return status?.isOnline ?? false;
  },
}));
