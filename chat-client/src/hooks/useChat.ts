import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG } from '../constants/config';
import { wsService } from '../services/websocket.service';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { MessageStatus, SocketEventType, type Attachment, type Message } from '../types/chat.types';

type InitialTopMostItemIndex =
    | number
    | {
          index: number;
          align: 'start' | 'end';
      }
    | null;

export function useChat() {
    const [messages, setMessages] = useState<Message[] | []>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [firstItemIndex, setFirstItemIndex] = useState(1000000);
    const [forceScrollToBottomToken, setForceScrollToBottomToken] = useState(0);
    const [initialTopMostItemIndex, setInitialTopMostItemIndex] =
        useState<InitialTopMostItemIndex>(null);
    const [unreadAnchorMessageId, setUnreadAnchorMessageId] = useState<string | null>(null);
    const { currentUserId } = useAuthStore();
    const {
        selectedProjectId,
        selectedUserId,
        clearUnreadCount,
        incrementUnreadCount,
        bumpLastMessageAt,
    } = useChatStore();
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadingMoreStartedAtRef = useRef<number | null>(null);
    const messagesRef = useRef<Message[]>([]);

    const HISTORY_PAGE_SIZE = 50;
    const INITIAL_FIRST_ITEM_INDEX = 1000000;
    const MIN_LOADING_MORE_MS = 50;
    const UNREAD_CONTEXT_BEFORE_COUNT = 8;

    useEffect(() => {
        messagesRef.current = messages as Message[];
    }, [messages]);

    const updateUploadProgress = useCallback(
        (
            clientMsgId: string,
            attachmentId: string,
            progress: number,
            etaSeconds: number | null,
        ) => {
            setMessages((prev) => {
                const index = prev.findIndex(
                    (m) => m.clientMsgId === clientMsgId || m.id === clientMsgId,
                );
                if (index === -1) return prev;

                const next = [...prev];
                const msg = next[index];
                const attachments = msg.attachments;
                if (!attachments || attachments.length === 0) {
                    next[index] = {
                        ...msg,
                        uploadProgress: progress,
                        uploadEtaSeconds: etaSeconds,
                    };
                    return next;
                }

                const updatedAttachments = attachments.map((a) =>
                    a.id === attachmentId
                        ? { ...a, uploadProgress: progress, uploadEtaSeconds: etaSeconds }
                        : a,
                );

                next[index] = {
                    ...msg,
                    attachments: updatedAttachments,
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
                (!content.trim() && (!attachments || attachments.length === 0))
            ) {
                return false;
            }

            // Move this conversation to the top immediately (WhatsApp behavior).
            bumpLastMessageAt(selectedUserId);

            const clientMsgId =
                tempId || `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const trimmedContent = content.trim();

            // Create or update optimistic message (so loader stays visible during upload)
            let didAppendNew = false;
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
                    projectId: selectedProjectId ?? null,
                    sender_id: currentUserId,
                    receiver_id: selectedUserId,
                    content: trimmedContent,
                    timestamp: new Date().toISOString(),
                    status: MessageStatus.PENDING,
                    attachments: attachments ? (attachments as Attachment[]) : undefined,
                };
                didAppendNew = true;
                return [...prev, optimisticMessage];
            });

            // When the local user sends a message, always jump to the bottom.
            // This mimics WhatsApp/Telegram behavior.
            if (didAppendNew) {
                setForceScrollToBottomToken((t) => t + 1);
            }

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
                    projectId: selectedProjectId ?? null,
                    content: trimmedContent,
                    attachments,
                },
            });
            return true;
        },
        [currentUserId, selectedUserId, selectedProjectId, bumpLastMessageAt],
    );

    const requestMessageHistory = useCallback(
        (page: number) => {
            if (!currentUserId || !selectedUserId) {
                return;
            }

            wsService.send({
                type: SocketEventType.MESSAGE_HISTORY,
                payload: {
                    projectId: selectedProjectId ?? null,
                    receiverId: selectedUserId,
                    page,
                    limit: HISTORY_PAGE_SIZE,
                },
            });
        },
        [currentUserId, selectedProjectId, selectedUserId],
    );

    // Load latest message history page (bottom of chat)
    const loadMessageHistory = useCallback(() => {
        if (!currentUserId || !selectedUserId) {
            return;
        }

        setIsLoadingHistory(true);
        setIsLoadingMoreHistory(false);
        setHistoryPage(1);
        setHistoryTotalPages(1);
        setFirstItemIndex(INITIAL_FIRST_ITEM_INDEX);
        setInitialTopMostItemIndex(null);
        setUnreadAnchorMessageId(null);
        setMessages([]);
        requestMessageHistory(1);
    }, [currentUserId, selectedProjectId, selectedUserId, requestMessageHistory]);

    const loadOlderMessages = useCallback(() => {
        if (isLoadingHistory || isLoadingMoreHistory) return;
        if (!selectedUserId || !currentUserId) return;
        if (historyPage >= historyTotalPages) return;

        setIsLoadingMoreHistory(true);
        loadingMoreStartedAtRef.current = Date.now();
        requestMessageHistory(historyPage + 1);
    }, [
        isLoadingHistory,
        isLoadingMoreHistory,
        selectedUserId,
        selectedProjectId,
        currentUserId,
        historyPage,
        historyTotalPages,
        requestMessageHistory,
    ]);

    // Mark messages as read
    const markMessagesAsRead = useCallback(
        (messageIds: string[]) => {
            if (!currentUserId || messageIds.length === 0) {
                return;
            }

            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const safeMessageIds = messageIds.filter((id) => uuidRegex.test(id));
            if (safeMessageIds.length === 0) {
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
                payload: { messageIds: safeMessageIds },
            });
        },
        [currentUserId],
    );

    // Send typing indicator
    const sendTypingIndicator = useCallback(() => {
        if (!selectedUserId) {
            return;
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Send typing start
        wsService.send({
            type: SocketEventType.TYPING_START,
            payload: { projectId: selectedProjectId ?? null },
        });

        // Auto-send typing stop after timeout
        typingTimeoutRef.current = setTimeout(() => {
            wsService.send({
                type: SocketEventType.TYPING_STOP,
                payload: { projectId: selectedProjectId ?? null },
            });
        }, CONFIG.CHAT.TYPING_TIMEOUT);
    }, [selectedProjectId, selectedUserId]);

    // Set up message event handlers
    useEffect(() => {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        // Message received handler
        const unsubMessageReceived = wsService.on(SocketEventType.MESSAGE_RECEIVED, (message) => {
            const msg: Message = message.payload;

            // Only handle messages for current project
            if ((msg.projectId ?? null) !== (selectedProjectId ?? null)) {
                return;
            }

            // Always bump the conversation to the top for activity ordering.
            const otherUserId =
                msg.sender_id === currentUserId
                    ? (msg.receiver_id as string | undefined)
                    : msg.sender_id;
            if (otherUserId) {
                const ts = Date.parse(msg.timestamp);
                bumpLastMessageAt(otherUserId, Number.isFinite(ts) ? ts : Date.now());
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
                        // Avoid double counts: server may emit provisional (clientMsgId) + final (UUID).
                        // Only count the persisted message (UUID id).
                        if (typeof msg.id === 'string' && uuidRegex.test(msg.id)) {
                            incrementUnreadCount(msg.sender_id);
                        }
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
        });

        // Message history handler
        const unsubMessageHistory = wsService.on(SocketEventType.MESSAGE_HISTORY, (message) => {
            const history: Message[] = message.payload.messages || [];
            const page = Number(message.payload.page || 1);
            const totalPages = Number(message.payload.totalPages || 1);

            setHistoryPage(page);
            setHistoryTotalPages(totalPages);

            if (page <= 1) {
                const nextFirstItemIndex = INITIAL_FIRST_ITEM_INDEX - history.length;
                setFirstItemIndex(nextFirstItemIndex);

                if (history.length > 0 && selectedUserId) {
                    const firstUnreadLocalIndex = history.findIndex(
                        (msg) =>
                            msg.sender_id === selectedUserId && msg.status !== MessageStatus.READ,
                    );

                    if (firstUnreadLocalIndex >= 0) {
                        setUnreadAnchorMessageId(history[firstUnreadLocalIndex]?.id ?? null);

                        const contextStartLocalIndex = Math.max(
                            0,
                            firstUnreadLocalIndex - UNREAD_CONTEXT_BEFORE_COUNT,
                        );
                        setInitialTopMostItemIndex({
                            index: nextFirstItemIndex + contextStartLocalIndex,
                            align: 'start',
                        });
                    } else {
                        setUnreadAnchorMessageId(null);
                        setInitialTopMostItemIndex({
                            index: nextFirstItemIndex + history.length - 1,
                            align: 'end',
                        });
                    }
                } else {
                    setUnreadAnchorMessageId(null);
                    setInitialTopMostItemIndex(null);
                }

                setMessages(history);

                // Set last activity time for this conversation based on newest message.
                if (selectedUserId && history.length > 0) {
                    const newest = history.reduce((acc, m) => {
                        const t = Date.parse(m.timestamp);
                        const tt = Number.isFinite(t) ? t : 0;
                        return tt > acc ? tt : acc;
                    }, 0);
                    if (newest > 0) bumpLastMessageAt(selectedUserId, newest);
                }

                setIsLoadingHistory(false);
                setIsLoadingMoreHistory(false);
                loadingMoreStartedAtRef.current = null;
            } else {
                const existing = new Set((messagesRef.current || []).map((m) => m.id));
                const uniqueOlder = history.filter((m) => !existing.has(m.id));

                if (uniqueOlder.length > 0) {
                    // Important: update firstItemIndex and messages in the same tick (no nested setState)
                    // so Virtuoso can preserve scroll position perfectly while prepending.
                    setFirstItemIndex((idx) => idx - uniqueOlder.length);
                    setMessages((prev) => [...uniqueOlder, ...prev]);
                }

                const startedAt = loadingMoreStartedAtRef.current;
                const elapsed = typeof startedAt === 'number' ? Date.now() - startedAt : 0;
                const remaining = MIN_LOADING_MORE_MS - elapsed;
                if (remaining > 0) {
                    setTimeout(() => setIsLoadingMoreHistory(false), remaining);
                } else {
                    setIsLoadingMoreHistory(false);
                }
                loadingMoreStartedAtRef.current = null;
            }

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
        bumpLastMessageAt,
    ]);

    // Load history when selected user changes
    useEffect(() => {
        if (selectedUserId && currentUserId) {
            loadMessageHistory();
        }
    }, [selectedUserId, selectedProjectId, currentUserId, loadMessageHistory]);

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

    // Cleanup
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
        sendTypingIndicator,
        isLoadingHistory,
        isLoadingMoreHistory,
        loadOlderMessages,
        hasMoreHistory: historyPage < historyTotalPages,
        firstItemIndex,
        forceScrollToBottomToken,
        initialTopMostItemIndex,
        unreadAnchorMessageId,
    };
}
