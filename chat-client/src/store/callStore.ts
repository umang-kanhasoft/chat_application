import { create } from 'zustand';

export type CallStatus = 'IDLE' | 'OUTGOING' | 'INCOMING' | 'CONNECTING' | 'IN_CALL';

export interface CallPeer {
    userId: string;
    userName?: string;
}

interface CallState {
    status: CallStatus;
    callId: string | null;
    peer: CallPeer | null;

    isMicMuted: boolean;
    isCameraOff: boolean;

    localStream: MediaStream | null;
    remoteStream: MediaStream | null;

    startedAt: number | null;
    error: string | null;

    setStatus: (status: CallStatus) => void;
    setCall: (callId: string | null, peer: CallPeer | null) => void;
    setLocalStream: (stream: MediaStream | null) => void;
    setRemoteStream: (stream: MediaStream | null) => void;
    setMicMuted: (muted: boolean) => void;
    setCameraOff: (off: boolean) => void;
    setStartedAt: (timestamp: number | null) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
    status: 'IDLE',
    callId: null,
    peer: null,

    isMicMuted: false,
    isCameraOff: false,

    localStream: null,
    remoteStream: null,

    startedAt: null,
    error: null,

    setStatus: (status) => set({ status }),
    setCall: (callId, peer) => set({ callId, peer }),
    setLocalStream: (localStream) => set({ localStream }),
    setRemoteStream: (remoteStream) => set({ remoteStream }),
    setMicMuted: (isMicMuted) => set({ isMicMuted }),
    setCameraOff: (isCameraOff) => set({ isCameraOff }),
    setStartedAt: (startedAt) => set({ startedAt }),
    setError: (error) => set({ error }),
    reset: () =>
        set({
            status: 'IDLE',
            callId: null,
            peer: null,
            isMicMuted: false,
            isCameraOff: false,
            localStream: null,
            remoteStream: null,
            startedAt: null,
            error: null,
        }),
}));
