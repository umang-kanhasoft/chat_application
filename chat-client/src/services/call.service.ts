import { WEBRTC_ICE_SERVERS } from '../constants/config';
import { useCallStore } from '../store/callStore';
import { SocketEventType } from '../types/chat.types';
import { wsService } from './websocket.service';

type SdpPayload = {
    callId: string;
    fromUserId?: string;
    sdp: RTCSessionDescriptionInit;
};

type IcePayload = {
    callId: string;
    fromUserId?: string;
    candidate: RTCIceCandidateInit;
};

function generateCallId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

class CallService {
    private pc: RTCPeerConnection | null = null;
    private pendingIce: RTCIceCandidateInit[] = [];

    private localStreamPromise: Promise<MediaStream> | null = null;

    private transceiversConfigured = false;

    private audioTransceiver: RTCRtpTransceiver | null = null;
    private videoTransceiver: RTCRtpTransceiver | null = null;

    private callId: string | null = null;

    private remoteStream: MediaStream | null = null;

    private disconnectGraceTimer: ReturnType<typeof setTimeout> | null = null;

    private statsTimer: ReturnType<typeof setInterval> | null = null;

    private videoUpgradeAttempted = false;

    private iceRestartAttempts = 0;
    private maxIceRestarts = 1;

    private ensureTransceivers(pc: RTCPeerConnection) {
        if (this.transceiversConfigured) return;

        try {
            this.audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
            this.videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });
        } catch {
            // ignore
        }

        this.transceiversConfigured = true;
    }

    private async maybeUpgradeToVideo() {
        if (this.videoUpgradeAttempted) return;
        this.videoUpgradeAttempted = true;

        const state = useCallStore.getState();
        const local = state.localStream;
        if (!local) return;

        // If we already have a live video track, nothing to do.
        const existingVideo = local.getVideoTracks()[0];
        if (existingVideo && existingVideo.readyState === 'live') return;

        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
            });
            const track = videoStream.getVideoTracks()[0];
            if (!track) return;

            const nextStream = new MediaStream([...local.getAudioTracks(), track]);
            state.setLocalStream(nextStream);
            state.setCameraOff(false);
            state.setError(null);

            const pc = this.ensurePeerConnection();
            this.ensureTransceivers(pc);

            if (this.videoTransceiver) {
                await this.videoTransceiver.sender.replaceTrack(track);
            } else {
                const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                if (sender) await sender.replaceTrack(track);
            }
        } catch (error) {
            console.error('[MEDIA] Video upgrade failed', error);
            if (error instanceof DOMException && error.name === 'NotReadableError') {
                state.setCameraOff(true);
                state.setError(
                    'Camera is busy (being used by another tab/app). Close other camera apps/tabs, then tap the Camera button to enable video.',
                );
            }
            // Keep call alive (audio-only). User can manually try via camera toggle.
        }
    }

    private ensurePeerConnection() {
        if (this.pc) return this.pc;

        const pc = new RTCPeerConnection({
            iceServers: WEBRTC_ICE_SERVERS,
        });
        pc.onicecandidate = (event) => {
            if (!event.candidate) return;
            if (!this.callId) return;
            wsService.send({
                type: SocketEventType.CALL_ICE_CANDIDATE,
                payload: {
                    callId: this.callId,
                    candidate: event.candidate.toJSON(),
                },
            });
        };

        pc.ontrack = (event) => {
            event.track.onmute = () => { };
            event.track.onunmute = () => { };

            // Handle track ended unexpectedly (e.g., remote muted/unplugged)
            event.track.onended = () => {
                // Optional: UI could show "Remote camera/mic off"
            };

            const stream = event.streams?.[0];
            if (stream) {
                // Always publish a fresh MediaStream reference built from the
                // stream's current tracks. This prevents a common issue where
                // the first ontrack is audio-only, UI binds srcObject, and then
                // the later video track doesn't trigger a rebind (appears frozen).
                const next = new MediaStream(stream.getTracks());
                this.remoteStream = next;
                useCallStore.getState().setRemoteStream(next);

                const state = useCallStore.getState();
                if (state.status === 'CONNECTING') {
                    state.setStatus('IN_CALL');
                    if (!state.startedAt) state.setStartedAt(Date.now());
                }
                return;
            }

            // Some browsers/devices may not populate event.streams.
            // In that case, we build and publish a fresh MediaStream reference.
            // This guarantees React sees an updated `remoteStream` and the UI swaps
            // from the loader to the <video> element.
            const track = event.track;
            const prevTracks = this.remoteStream ? this.remoteStream.getTracks() : [];
            const nextTracks = prevTracks.some((t) => t.id === track.id)
                ? prevTracks
                : [...prevTracks, track];

            const next = new MediaStream(nextTracks);
            this.remoteStream = next;
            useCallStore.getState().setRemoteStream(next);

            const state = useCallStore.getState();
            if (state.status === 'CONNECTING') {
                state.setStatus('IN_CALL');
                if (!state.startedAt) state.setStartedAt(Date.now());
            }
        };

        pc.onconnectionstatechange = () => {
            if (!this.callId) return;
            if (pc.connectionState === 'connected') {
                const state = useCallStore.getState();
                if (state.status === 'CONNECTING') {
                    state.setStatus('IN_CALL');
                    if (!state.startedAt) state.setStartedAt(Date.now());
                }

                this.startStatsLoop();
                void this.maybeUpgradeToVideo();

                // Fallback: if we haven't received remote tracks yet but ICE is connected,
                // try to get the transceivers and build a stream manually
                if (!this.remoteStream || this.remoteStream.getTracks().length === 0) {
                    const receiverTracks = pc
                        .getReceivers()
                        .map((r) => r.track)
                        .filter(Boolean);
                    if (receiverTracks.length > 0) {
                        const fallbackStream = new MediaStream(receiverTracks);
                        this.remoteStream = fallbackStream;
                        useCallStore.getState().setRemoteStream(fallbackStream);
                    }
                }
            }
            if (pc.connectionState === 'failed') {
                this.stopStatsLoop();
                this.hangup('connection_failed');
                return;
            }

            if (pc.connectionState === 'disconnected') {
                if (this.disconnectGraceTimer) return;
                this.disconnectGraceTimer = setTimeout(() => {
                    this.disconnectGraceTimer = null;
                    if (!this.pc) return;
                    if (
                        this.pc.connectionState === 'disconnected' ||
                        this.pc.connectionState === 'failed'
                    ) {
                        this.stopStatsLoop();
                        this.hangup('connection_lost');
                    }
                }, 10000);
                return;
            }

            if (this.disconnectGraceTimer) {
                clearTimeout(this.disconnectGraceTimer);
                this.disconnectGraceTimer = null;
            }

            if (pc.connectionState === 'closed') {
                this.stopStatsLoop();
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (!this.callId) return;
            if (pc.iceConnectionState === 'failed') {
                // Attempt ICE restart once before giving up
                if (this.iceRestartAttempts < this.maxIceRestarts) {
                    this.iceRestartAttempts++;
                    void this.restartIce();
                    return;
                }
                this.hangup('ice_failed');
                return;
            }

            if (pc.iceConnectionState === 'disconnected') {
                if (this.disconnectGraceTimer) return;
                this.disconnectGraceTimer = setTimeout(() => {
                    this.disconnectGraceTimer = null;
                    if (!this.pc) return;
                    if (
                        this.pc.iceConnectionState === 'disconnected' ||
                        this.pc.iceConnectionState === 'failed'
                    ) {
                        this.hangup('ice_disconnected');
                    }
                }, 10000);
                return;
            }

            if (this.disconnectGraceTimer) {
                clearTimeout(this.disconnectGraceTimer);
                this.disconnectGraceTimer = null;
            }
        };

        this.ensureTransceivers(pc);

        this.pc = pc;
        return pc;
    }

    private async ensureLocalStream() {
        const state = useCallStore.getState();
        if (state.localStream) {
            const tracks = state.localStream.getTracks();
            const ended = tracks.length > 0 && tracks.every((t) => t.readyState === 'ended');
            if (!ended) return state.localStream;

            this.stopStream(state.localStream);
            state.setLocalStream(null);
        }

        if (this.localStreamPromise) {
            return this.localStreamPromise;
        }

        this.localStreamPromise = (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                state.setLocalStream(stream);
                state.setMicMuted(false);
                state.setCameraOff(false);
                return stream;
            } catch (error) {
                if (error instanceof DOMException && error.name === 'NotReadableError') {
                    // Retry once after a short delay (helps with transient camera busy)
                    await new Promise((r) => setTimeout(r, 2000));
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: true,
                            audio: true,
                        });
                        state.setLocalStream(stream);
                        state.setMicMuted(false);
                        state.setCameraOff(false);
                        return stream;
                    } catch {
                        // ignore
                    }
                }
                if (error instanceof DOMException && error.name === 'NotReadableError') {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: false,
                            audio: true,
                        });
                        state.setLocalStream(stream);
                        state.setMicMuted(false);
                        state.setCameraOff(true);
                        state.setError('Camera is busy. Continuing with audio only.');
                        return stream;
                    } catch {
                        // ignore
                    }
                }
                throw error;
            } finally {
                this.localStreamPromise = null;
            }
        })();

        return this.localStreamPromise;
    }

    private stopStream(stream: MediaStream | null) {
        if (!stream) return;
        stream.getTracks().forEach((t) => t.stop());
    }

    private async addLocalTracksToPeerConnection(pc: RTCPeerConnection) {
        const local = await this.ensureLocalStream();

        this.ensureTransceivers(pc);

        const ops: Array<Promise<void>> = [];

        local.getTracks().forEach((track) => {
            if (track.kind === 'audio' && this.audioTransceiver?.sender) {
                ops.push(this.audioTransceiver.sender.replaceTrack(track));
                return;
            }
            if (track.kind === 'video' && this.videoTransceiver?.sender) {
                ops.push(this.videoTransceiver.sender.replaceTrack(track));
                return;
            }

            // Fallback for environments that don't support transceivers.
            const alreadyAdded = pc.getSenders().some((s) => s.track?.id === track.id);
            if (!alreadyAdded) pc.addTrack(track, local);
        });

        if (ops.length > 0) {
            await Promise.allSettled(ops);
        }
    }

    private async flushPendingIce() {
        if (!this.pc) return;
        if (!this.pc.remoteDescription) return;
        if (this.pendingIce.length === 0) return;

        const pending = [...this.pendingIce];
        this.pendingIce = [];

        for (const candidate of pending) {
            try {
                await this.pc.addIceCandidate(candidate);
            } catch {
                // ignore
            }
        }
    }

    private resetInternal() {
        this.callId = null;
        this.pendingIce = [];
        this.remoteStream = null;
        this.localStreamPromise = null;
        this.transceiversConfigured = false;
        this.audioTransceiver = null;
        this.videoTransceiver = null;
        this.iceRestartAttempts = 0;
        this.videoUpgradeAttempted = false;

        if (this.disconnectGraceTimer) {
            clearTimeout(this.disconnectGraceTimer);
            this.disconnectGraceTimer = null;
        }

        this.stopStatsLoop();

        if (this.pc) {
            this.pc.onicecandidate = null;
            this.pc.ontrack = null;
            this.pc.onconnectionstatechange = null;
            this.pc.oniceconnectionstatechange = null;
            this.pc.close();
            this.pc = null;
        }
    }

    private startStatsLoop() {
        if (!this.pc) return;
        if (this.statsTimer) return;

        const pc = this.pc;
        this.statsTimer = setInterval(async () => {
            if (!this.pc || this.pc !== pc) {
                this.stopStatsLoop();
                return;
            }

            try {
                await pc.getStats();
            } catch (error) {
                console.error('[STATS] failed', error);
            }
        }, 2000);
    }

    private stopStatsLoop() {
        if (!this.statsTimer) return;
        clearInterval(this.statsTimer);
        this.statsTimer = null;
    }

    private async restartIce() {
        const pc = this.pc;
        if (!pc || !this.callId) return;

        try {
            const offer = await pc.createOffer({ iceRestart: true });
            await pc.setLocalDescription(offer);
            wsService.send({
                type: SocketEventType.CALL_OFFER,
                payload: { callId: this.callId, sdp: offer },
            });
        } catch (error) {
            console.error('[ICE] Restart failed', error);
            this.hangup('ice_restart_failed');
        }
    }

    private cleanupAndReset() {
        const state = useCallStore.getState();
        this.stopStream(state.localStream);
        this.stopStream(state.remoteStream);

        state.reset();
        this.resetInternal();
    }

    async startCall(toUserId: string, toUserName?: string) {
        const state = useCallStore.getState();

        if (state.status !== 'IDLE') {
            return;
        }

        const callId = generateCallId();

        this.callId = callId;

        state.setError(null);
        state.setRemoteStream(null);
        state.setLocalStream(null);
        state.setStartedAt(null);
        state.setCall(callId, { userId: toUserId, userName: toUserName });
        state.setStatus('OUTGOING');

        try {
            await this.ensureLocalStream();
        } catch {
            state.setError('Camera/microphone permission denied');
            this.cleanupAndReset();
            return;
        }

        wsService.send({
            type: SocketEventType.CALL_START,
            payload: { callId, toUserId },
        });
    }

    async acceptIncomingCall() {
        const state = useCallStore.getState();
        if (state.status !== 'INCOMING') return;
        if (!state.callId || !state.peer) return;

        this.callId = state.callId;

        state.setStatus('CONNECTING');
        state.setError(null);

        try {
            await this.ensureLocalStream();
        } catch (error) {
            const name = error instanceof DOMException ? error.name : '';
            state.setError(
                name === 'NotAllowedError'
                    ? 'Camera/microphone permission denied'
                    : 'Failed to access camera/microphone',
            );
            wsService.send({
                type: SocketEventType.CALL_REJECT,
                payload: { callId: state.callId, reason: 'permission_denied' },
            });
            this.cleanupAndReset();
            return;
        }

        wsService.send({
            type: SocketEventType.CALL_ACCEPT,
            payload: { callId: state.callId },
        });
    }

    rejectIncomingCall(reason?: string) {
        const state = useCallStore.getState();
        if (!state.callId) {
            this.cleanupAndReset();
            return;
        }

        wsService.send({
            type: SocketEventType.CALL_REJECT,
            payload: { callId: state.callId, reason: reason || 'rejected' },
        });

        this.cleanupAndReset();
    }

    hangup(reason?: string) {
        const state = useCallStore.getState();
        const callId = state.callId || this.callId;
        if (callId) {
            wsService.send({
                type: SocketEventType.CALL_END,
                payload: { callId, reason: reason || 'ended' },
            });
        }

        this.cleanupAndReset();
    }

    toggleMic() {
        const state = useCallStore.getState();
        const stream = state.localStream;
        if (!stream) return;

        const next = !state.isMicMuted;
        stream.getAudioTracks().forEach((t) => (t.enabled = !next));
        state.setMicMuted(next);
    }

    toggleCamera() {
        const state = useCallStore.getState();
        const stream = state.localStream;
        if (!stream) return;

        const next = !state.isCameraOff;

        // Turning camera OFF: just disable existing tracks.
        if (next) {
            stream.getVideoTracks().forEach((t) => (t.enabled = false));
            state.setCameraOff(true);
            return;
        }

        // Turning camera ON: if we already have a video track, enable it.
        const existingVideo = stream.getVideoTracks()[0];
        if (existingVideo) {
            existingVideo.enabled = true;
            state.setCameraOff(false);
            return;
        }

        // If we joined audio-only (camera busy/blocked), try to acquire video now and
        // replace into the existing RTCRtpSender/Transceiver.
        void (async () => {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
                const track = videoStream.getVideoTracks()[0];
                if (!track) return;

                const nextStream = new MediaStream([...stream.getAudioTracks(), track]);
                state.setLocalStream(nextStream);
                state.setCameraOff(false);

                const pc = this.ensurePeerConnection();
                this.ensureTransceivers(pc);

                if (this.videoTransceiver) {
                    await this.videoTransceiver.sender.replaceTrack(track);
                } else {
                    const sender = pc
                        .getSenders()
                        .find(
                            (s) =>
                                s.track?.kind === 'video' ||
                                (!s.track && s.getParameters().encodings),
                        );
                    if (sender) {
                        await sender.replaceTrack(track);
                    }
                }

                // Stop the temporary capture stream container if it has extra tracks.
                videoStream.getTracks().forEach((t) => {
                    if (t.id !== track.id) t.stop();
                });
            } catch (error) {
                console.error('[MEDIA] Failed to enable camera during call', error);
                state.setError('Unable to enable camera. It may be in use by another app/tab.');
                state.setCameraOff(true);
            }
        })();
    }

    async onIncomingCall(payload: { callId: string; fromUserId: string; fromUserName?: string }) {
        const state = useCallStore.getState();
        if (state.status !== 'IDLE') {
            wsService.send({
                type: SocketEventType.CALL_REJECT,
                payload: { callId: payload.callId, reason: 'busy' },
            });
            return;
        }

        state.setError(null);
        state.setRemoteStream(null);
        state.setLocalStream(null);
        state.setStartedAt(null);
        state.setCall(payload.callId, {
            userId: payload.fromUserId,
            userName: payload.fromUserName,
        });
        state.setStatus('INCOMING');
    }

    async onCallAccepted(payload: { callId: string }) {
        const state = useCallStore.getState();
        if (state.status !== 'OUTGOING') return;
        if (!this.callId || payload.callId !== this.callId) return;

        state.setStatus('CONNECTING');

        const pc = this.ensurePeerConnection();
        await this.addLocalTracksToPeerConnection(pc);

        const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        });

        await pc.setLocalDescription(offer);

        wsService.send({
            type: SocketEventType.CALL_OFFER,
            payload: {
                callId: this.callId,
                sdp: offer,
            },
        });
    }

    onCallRejected(payload: { callId: string; reason?: string }) {
        const state = useCallStore.getState();
        if (state.callId !== payload.callId) return;

        state.setError(payload.reason || 'Call rejected');
        this.cleanupAndReset();
    }

    onCallBusy(payload: { callId: string }) {
        const state = useCallStore.getState();
        if (state.callId !== payload.callId) return;

        state.setError('User is busy');
        this.cleanupAndReset();
    }

    async onOffer(payload: SdpPayload) {
        const state = useCallStore.getState();
        if (!state.callId || state.callId !== payload.callId) return;

        const pc = this.ensurePeerConnection();
        await this.addLocalTracksToPeerConnection(pc);

        await pc.setRemoteDescription(payload.sdp);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        wsService.send({
            type: SocketEventType.CALL_ANSWER,
            payload: {
                callId: payload.callId,
                sdp: answer,
            },
        });

        await this.flushPendingIce();

        state.setStatus('IN_CALL');
        if (!state.startedAt) state.setStartedAt(Date.now());
    }

    async onAnswer(payload: SdpPayload) {
        const state = useCallStore.getState();
        if (!state.callId || state.callId !== payload.callId) return;

        const pc = this.ensurePeerConnection();
        await pc.setRemoteDescription(payload.sdp);

        await this.flushPendingIce();

        state.setStatus('IN_CALL');
        if (!state.startedAt) state.setStartedAt(Date.now());
    }

    async onRemoteIceCandidate(payload: IcePayload) {
        const state = useCallStore.getState();
        if (!state.callId || state.callId !== payload.callId) return;

        const pc = this.ensurePeerConnection();

        if (!pc.remoteDescription) {
            this.pendingIce.push(payload.candidate);
            return;
        }

        try {
            await pc.addIceCandidate(payload.candidate);
        } catch {
            // ignore
        }
    }

    onRemoteEnd(payload: { callId: string; reason?: string }) {
        const state = useCallStore.getState();
        if (state.callId !== payload.callId) return;

        state.setError(payload.reason || null);
        this.cleanupAndReset();
    }
}

export const callService = new CallService();
