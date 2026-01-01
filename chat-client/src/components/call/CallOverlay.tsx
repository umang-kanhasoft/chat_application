import { useEffect, useMemo, useRef, useState } from 'react';
import { useCallStore } from '../../store/callStore';
import { callService } from '../../services/call.service';
import { cn } from '../../utils/helpers';

function formatDuration(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export function CallOverlay() {
    const { status, peer, localStream, remoteStream, isMicMuted, isCameraOff, startedAt, error } =
        useCallStore();

    const [tick, setTick] = useState(0);
    const [isRemoteMuted, setIsRemoteMuted] = useState(true);

    const now = useMemo(() => Date.now(), [tick]);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (status !== 'IN_CALL') return;

        const id = setInterval(() => {
            setTick((t) => t + 1);
        }, 500);

        return () => clearInterval(id);
    }, [status]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            void localVideoRef.current.play().catch(() => {
                // autoplay may be blocked; user interaction will start playback
            });
        }

        return () => {
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
        };
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.onloadedmetadata = () => {};
            remoteVideoRef.current.onplaying = () => {};
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.muted = isRemoteMuted;
            void remoteVideoRef.current.play().catch(() => {});
        }

        return () => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.onloadedmetadata = null;
                remoteVideoRef.current.onplaying = null;
                remoteVideoRef.current.srcObject = null;
            }
        };
    }, [remoteStream, isRemoteMuted]);

    const title = useMemo(() => {
        const name = peer?.userName || 'User';
        if (status === 'OUTGOING') return `Calling ${name}`;
        if (status === 'INCOMING') return `${name} is calling…`;
        if (status === 'CONNECTING') return `Connecting to ${name}`;
        if (status === 'IN_CALL') return name;
        return '';
    }, [peer?.userName, status]);

    const show = status !== 'IDLE';
    if (!show) return null;

    const inCall = status === 'IN_CALL';

    return (
        <div className="fixed inset-0 z-999">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black" />

            {/* Remote video / placeholder */}
            <div className="absolute inset-0">
                {remoteStream ? (
                    <>
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            muted={isRemoteMuted}
                            playsInline
                            className="h-full w-full object-cover"
                            onClick={() => {
                                setIsRemoteMuted(false);
                                if (remoteVideoRef.current) {
                                    remoteVideoRef.current.muted = false;
                                    void remoteVideoRef.current.play().catch(() => {
                                        // ignore
                                    });
                                }
                            }}
                        />
                        {isRemoteMuted ? (
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRemoteMuted(false);
                                        if (remoteVideoRef.current) {
                                            remoteVideoRef.current.muted = false;
                                            void remoteVideoRef.current.play().catch(() => {
                                                // ignore
                                            });
                                        }
                                    }}
                                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm border border-white/10"
                                >
                                    Enable sound
                                </button>
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-white text-xl font-semibold mb-2">{title}</div>
                            <div className="text-white/70 text-sm">
                                {status === 'INCOMING'
                                    ? 'Incoming video call'
                                    : status === 'OUTGOING'
                                      ? 'Ringing…'
                                      : 'Connecting…'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-4">
                <div className="mx-auto max-w-3xl flex items-start justify-between">
                    <div>
                        <div className="text-white font-semibold text-lg leading-tight">
                            {title}
                        </div>
                        <div className="text-white/70 text-sm">
                            {inCall && startedAt ? formatDuration(now - startedAt) : status}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => callService.hangup('hangup')}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm border border-white/10"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Local preview */}
            <div className="absolute bottom-28 right-4 md:right-8">
                <div
                    className={cn(
                        'w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden',
                        'bg-black/40 border border-white/10 shadow-2xl',
                    )}
                >
                    {localStream ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-white/70 text-xs">
                            Camera
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="mx-auto max-w-3xl flex items-center justify-center gap-3">
                    {status === 'INCOMING' ? (
                        <>
                            <button
                                type="button"
                                onClick={() => callService.rejectIncomingCall('rejected')}
                                className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg"
                                aria-label="Reject"
                                title="Reject"
                            >
                                <span className="text-lg">✕</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => callService.acceptIncomingCall()}
                                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg"
                                aria-label="Accept"
                                title="Accept"
                            >
                                <span className="text-lg">✓</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => callService.toggleMic()}
                                className={cn(
                                    'w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg',
                                    isMicMuted
                                        ? 'bg-white/10 hover:bg-white/15'
                                        : 'bg-white/20 hover:bg-white/25',
                                )}
                                aria-label="Toggle microphone"
                                title={isMicMuted ? 'Unmute' : 'Mute'}
                            >
                                <span className="text-lg">{isMicMuted ? '🎙️' : '🎤'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => callService.toggleCamera()}
                                className={cn(
                                    'w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg',
                                    isCameraOff
                                        ? 'bg-white/10 hover:bg-white/15'
                                        : 'bg-white/20 hover:bg-white/25',
                                )}
                                aria-label="Toggle camera"
                                title={isCameraOff ? 'Camera on' : 'Camera off'}
                            >
                                <span className="text-lg">{isCameraOff ? '📷' : '🎥'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => callService.hangup('hangup')}
                                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg"
                                aria-label="End call"
                                title="End call"
                            >
                                <span className="text-xl">⏹</span>
                            </button>
                        </>
                    )}
                </div>

                {error ? (
                    <div className="mt-3 text-center text-sm text-red-200">{error}</div>
                ) : null}
            </div>
        </div>
    );
}
