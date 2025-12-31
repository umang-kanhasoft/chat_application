import { useEffect } from 'react';
import { callService } from '../services/call.service';
import { wsService } from '../services/websocket.service';
import { SocketEventType } from '../types/chat.types';

export function useCallSignaling() {
    useEffect(() => {
        const unsubRinging = wsService.on(SocketEventType.CALL_RINGING, (message) => {
            const { callId, fromUserId, fromUserName } = message.payload || {};
            if (!callId || !fromUserId) return;
            void callService.onIncomingCall({ callId, fromUserId, fromUserName });
        });

        const unsubAccept = wsService.on(SocketEventType.CALL_ACCEPT, (message) => {
            const { callId } = message.payload || {};
            if (!callId) return;
            void callService.onCallAccepted({ callId });
        });

        const unsubReject = wsService.on(SocketEventType.CALL_REJECT, (message) => {
            const { callId, reason } = message.payload || {};
            if (!callId) return;
            callService.onCallRejected({ callId, reason });
        });

        const unsubBusy = wsService.on(SocketEventType.CALL_BUSY, (message) => {
            const { callId } = message.payload || {};
            if (!callId) return;
            callService.onCallBusy({ callId });
        });

        const unsubOffer = wsService.on(SocketEventType.CALL_OFFER, (message) => {
            const { callId, sdp, fromUserId } = message.payload || {};
            if (!callId || !sdp) return;
            void callService.onOffer({ callId, sdp, fromUserId });
        });

        const unsubAnswer = wsService.on(SocketEventType.CALL_ANSWER, (message) => {
            const { callId, sdp, fromUserId } = message.payload || {};
            if (!callId || !sdp) return;
            void callService.onAnswer({ callId, sdp, fromUserId });
        });

        const unsubIce = wsService.on(SocketEventType.CALL_ICE_CANDIDATE, (message) => {
            const { callId, candidate, fromUserId } = message.payload || {};
            if (!callId || !candidate) return;
            void callService.onRemoteIceCandidate({ callId, candidate, fromUserId });
        });

        const unsubEnd = wsService.on(SocketEventType.CALL_END, (message) => {
            const { callId, reason } = message.payload || {};
            if (!callId) return;
            callService.onRemoteEnd({ callId, reason });
        });

        return () => {
            unsubRinging();
            unsubAccept();
            unsubReject();
            unsubBusy();
            unsubOffer();
            unsubAnswer();
            unsubIce();
            unsubEnd();
        };
    }, []);
}
