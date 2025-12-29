import { useEffect, useState, useCallback, useRef } from 'react';
import { wsService } from '../services/websocket.service';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { SocketEventType, MessageStatus, type Message, type Attachment } from '../types/chat.types';
import { CONFIG } from '../constants/config';

export function useChat() {
    const [messages, setMessages] = useState<Message[] | []>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const { currentUserId } = useAuthStore();
    const { selectedProjectId, selectedUserId, clearUnreadCount, incrementUnreadCount } =
        useChatStore();
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updateUploadProgress = useCallback(
        (clientMsgId: string, progress: number, etaSeconds: number | null) => {
            setMessages((prev) => {
                const index = prev.findIndex(
                    (m) => m.clientMsgId === clientMsgId || m.id === clientMsgId,
                );
                if (index === -1) return prev;

                const next = [...prev];
                next[index] = {
                    ...next[index],
                    uploadProgress: progress,
                    uploadEtaSeconds: etaSeconds,
                };
                return next;
            });
        },
        [],
    );

    // Send message
    const sendMessage = useCallback(
        (content: string, attachments?: unknown[], tempId?: string) => {
            if (
                !currentUserId ||
                !selectedUserId ||
                !selectedProjectId ||
                (!content.trim() && (!attachments || attachments.length === 0))
            ) {
                return false;
            }

            const clientMsgId =
                tempId || `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const trimmedContent = content.trim();

            // Create or update optimistic message (so loader stays visible during upload)
            setMessages((prev) => {
                const index = prev.findIndex(
                    (m) => m.clientMsgId === clientMsgId || m.id === clientMsgId,
                );

                if (index > -1) {
                    const next = [...prev];
                    next[index] = {
                        ...next[index],
                        clientMsgId,
                        content: trimmedContent || next[index].content,
                        attachments: attachments
                            ? (attachments as Attachment[])
                            : next[index].attachments,
                    };
                    return next;
                }

                const optimisticMessage: Message = {
                    id: clientMsgId,
                    clientMsgId,
                    projectId: selectedProjectId,
                    sender_id: currentUserId,
                    receiver_id: selectedUserId,
                    content: trimmedContent,
                    timestamp: new Date().toISOString(),
                    status: MessageStatus.PENDING,
                    attachments: attachments ? (attachments as Attachment[]) : undefined,
                };
                return [...prev, optimisticMessage];
            });

            const hasUploadingPlaceholder =
                !!attachments && (attachments as Attachment[]).some((a) => a?.url === 'uploading');

            // Keep placeholder-only messages local to the sender.
            // Receiver should only get the final message once upload is complete.
            if (hasUploadingPlaceholder) {
                return true;
            }

            // Always send to server; backend is idempotent on clientMsgId
            wsService.send({
                type: SocketEventType.MESSAGE_SEND,
                payload: {
                    clientMsgId,
                    receiver_id: selectedUserId,
                    projectId: selectedProjectId,
                    content: trimmedContent,
                    attachments,
                },
            });
            return true;
        },
        [currentUserId, selectedUserId, selectedProjectId],
    );

    // Load message history
    const loadMessageHistory = useCallback(() => {
        if (!currentUserId || !selectedProjectId || !selectedUserId) {
            return;
        }

        setIsLoadingHistory(true);
        wsService.send({
            type: SocketEventType.MESSAGE_HISTORY,
            payload: {
                projectId: selectedProjectId,
                receiverId: selectedUserId,
            },
        });
    }, [currentUserId, selectedProjectId, selectedUserId]);

    // Mark messages as read
    const markMessagesAsRead = useCallback(
        (messageIds: string[]) => {
            if (!currentUserId || messageIds.length === 0) {
                return;
            }

            // Update local state immediately for the receiver
            setMessages((prev) =>
                prev.map((msg) =>
                    messageIds.includes(msg.id) ? { ...msg, status: MessageStatus.READ } : msg,
                ),
            );

            wsService.send({
                type: SocketEventType.MARK_AS_READ,
                payload: { messageIds },
            });
        },
        [currentUserId],
    );

    // Send typing indicator
    const sendTypingIndicator = useCallback(() => {
        if (!selectedProjectId || !selectedUserId) {
            return;
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Send typing start
        wsService.send({
            type: SocketEventType.TYPING_START,
            payload: { projectId: selectedProjectId },
        });

        // Auto-send typing stop after timeout
        typingTimeoutRef.current = setTimeout(() => {
            wsService.send({
                type: SocketEventType.TYPING_STOP,
                payload: { projectId: selectedProjectId },
            });
        }, CONFIG.CHAT.TYPING_TIMEOUT);
    }, [selectedProjectId, selectedUserId]);

    // Stop typing indicator
    const stopTypingIndicator = useCallback(() => {
        if (!selectedProjectId) {
            return;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        wsService.send({
            type: SocketEventType.TYPING_STOP,
            payload: { projectId: selectedProjectId },
        });
    }, [selectedProjectId]);

    // Set up message event handlers
    useEffect(() => {
        // Message received handler
        const unsubMessageReceived = wsService.on(SocketEventType.MESSAGE_RECEIVED, (message) => {
            const msg: Message = message.payload;

            // Only handle messages for current project
            if (msg.projectId !== selectedProjectId) {
                return;
            }

            // Check if message belongs to the current open conversation
            const isFromSelectedUser = msg.sender_id === selectedUserId;
            const isToSelectedUser = msg.receiver_id === selectedUserId;
            const isSentByMe = msg.sender_id === currentUserId;

            // If we have a selected user, only add if message is between us
            if (selectedUserId) {
                if (
                    !(
                        (isFromSelectedUser && msg.receiver_id === currentUserId) ||
                        (isSentByMe && isToSelectedUser)
                    )
                ) {
                    // Message doesn't belong to current chat, handle unread count and return
                    if (!isSentByMe) {
                        incrementUnreadCount(msg.sender_id);
                    }
                    return;
                }
            }

            // Add message to list
            setMessages((prev) => {
                // Check if this is a confirmation for an optimistic message
                if (msg.clientMsgId) {
                    const index = prev.findIndex(
                        (m) => m.clientMsgId === msg.clientMsgId || m.id === msg.clientMsgId,
                    );
                    if (index > -1) {
                        const newMessages = [...prev];
                        const prevMsg = newMessages[index];
                        const isStillUploading = msg.attachments?.some(
                            (a: any) => a?.url === 'uploading',
                        );
                        newMessages[index] = {
                            ...msg,
                            status: msg.status || MessageStatus.SENT,
                            uploadProgress: isStillUploading ? prevMsg.uploadProgress : undefined,
                            uploadEtaSeconds: isStillUploading
                                ? prevMsg.uploadEtaSeconds
                                : undefined,
                        }; // Replace optimistic message with server message, but keep live upload UI
                        return newMessages;
                    }
                }

                // Check if message already exists (avoid duplicates)
                if (prev.some((m) => m.id === msg.id)) {
                    return prev;
                }
                return [...prev, msg];
            });

            // Handle unread count and read marking for active conversation
            if (isFromSelectedUser && msg.receiver_id === currentUserId) {
                // Message from selected user - mark as read instantly
                markMessagesAsRead([msg.id]);
            } else if (!isSentByMe) {
                // Message from different user (not the one we are chatting with) - increment unread
                // This part is technically redundant due to the check above but kept for safety
                incrementUnreadCount(msg.sender_id);
            }
        });

        // Message history handler
        const unsubMessageHistory = wsService.on(SocketEventType.MESSAGE_HISTORY, (message) => {
            const history: Message[] = message.payload.messages || [];
            setMessages(history);
            setIsLoadingHistory(false);

            // Mark unread messages as read
            const unreadMessageIds = history
                .filter(
                    (msg) => msg.sender_id === selectedUserId && msg.status !== MessageStatus.READ,
                )
                .map((msg) => msg.id);

            if (unreadMessageIds.length > 0) {
                markMessagesAsRead(unreadMessageIds);
            }

            // Clear unread count for selected user
            if (selectedUserId) {
                clearUnreadCount(selectedUserId);
            }
        });

        // Message read handler
        const unsubMessageRead = wsService.on(SocketEventType.MESSAGE_READ, (message) => {
            const { messageIds } = message.payload;

            // Update message statuses
            setMessages((prev) =>
                prev.map((msg) =>
                    messageIds.includes(msg.id) ? { ...msg, status: MessageStatus.READ } : msg,
                ),
            );
        });

        // Message delivered handler
        const unsubMessageDelivered = wsService.on(SocketEventType.MESSAGE_DELIVERED, (message) => {
            const { messageIds } = message.payload;

            // Update message statuses
            setMessages((prev) =>
                prev.map((msg) =>
                    messageIds.includes(msg.id) && msg.status !== MessageStatus.READ
                        ? { ...msg, status: MessageStatus.DELIVERED }
                        : msg,
                ),
            );
        });

        // Cleanup
        return () => {
            unsubMessageReceived();
            unsubMessageHistory();
            unsubMessageRead();
            unsubMessageDelivered();
        };
    }, [
        currentUserId,
        selectedProjectId,
        selectedUserId,
        markMessagesAsRead,
        clearUnreadCount,
        incrementUnreadCount,
    ]);

    // Load history when selected user changes
    useEffect(() => {
        if (selectedUserId && selectedProjectId && currentUserId) {
            wsService.send({
                type: SocketEventType.MESSAGE_HISTORY,
                payload: {
                    projectId: selectedProjectId,
                    receiverId: selectedUserId,
                },
            });
            // setIsLoadingHistory(true);
        }
    }, [selectedUserId, selectedProjectId, currentUserId]);

    // Mark messages as read when window gains focus
    useEffect(() => {
        const handleFocus = () => {
            if (!selectedUserId) return;

            const unreadIds = messages
                .filter((m) => m.sender_id === selectedUserId && m.status !== MessageStatus.READ)
                .map((m) => m.id);

            if (unreadIds.length > 0) {
                markMessagesAsRead(unreadIds);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [messages, selectedUserId, markMessagesAsRead]);

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return {
        messages,
        sendMessage,
        updateUploadProgress,
        loadMessageHistory,
        markMessagesAsRead,
        sendTypingIndicator,
        stopTypingIndicator,
        isLoadingHistory,
    };
}
