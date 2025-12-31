import { useEffect, useRef } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useAuthStore } from '../../store/authStore';
import type { Message } from '../../types/chat.types';
import { EmptyState } from '../ui/EmptyState';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
    messages: Message[];
    isLoading?: boolean;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    firstItemIndex: number;
    onLoadOlder: () => void;
    forceScrollToBottomToken?: number;
    initialTopMostItemIndex?:
        | number
        | {
              index: number;
              align: 'start' | 'end';
          }
        | null;
    unreadAnchorMessageId?: string | null;
}

export function MessageList({
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    firstItemIndex,
    onLoadOlder,
    forceScrollToBottomToken,
    initialTopMostItemIndex,
    unreadAnchorMessageId,
}: MessageListProps) {
    const { currentUserId } = useAuthStore();
    const virtuosoRef = useRef<VirtuosoHandle | null>(null);
    const initialScrollDoneRef = useRef(false);
    const isAtBottomRef = useRef(true);
    const prevMessagesLengthRef = useRef(0);
    const initialTopMostItemIndexRef = useRef<
        | number
        | {
              index: number;
              align: 'start' | 'end';
          }
        | null
    >(null);
    const alignToBottomRef = useRef(true);

    const rafScrollRef = useRef<number | null>(null);
    const scrollToBottomIfPinned = () => {
        if (messages.length === 0) return;
        if (!isAtBottomRef.current) return;
        if (isLoadingMore) return;

        if (rafScrollRef.current) {
            cancelAnimationFrame(rafScrollRef.current);
        }

        rafScrollRef.current = requestAnimationFrame(() => {
            const lastIndex = firstItemIndex + messages.length - 1;
            virtuosoRef.current?.scrollToIndex({
                index: lastIndex,
                align: 'end',
                behavior: 'auto',
            });
        });
    };

    useEffect(() => {
        return () => {
            if (rafScrollRef.current) {
                cancelAnimationFrame(rafScrollRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (messages.length === 0) return;
        // Mark initial positioning as done once we have messages.
        // Virtuoso initialTopMostItemIndex handles the initial bottom positioning without a visible scroll.
        initialScrollDoneRef.current = true;
    }, [messages.length]);

    useEffect(() => {
        if (!forceScrollToBottomToken) return;
        if (messages.length === 0) return;

        const lastIndex = firstItemIndex + messages.length - 1;
        isAtBottomRef.current = true;
        virtuosoRef.current?.scrollToIndex({ index: lastIndex, align: 'end', behavior: 'auto' });
    }, [forceScrollToBottomToken]);

    useEffect(() => {
        const prevLen = prevMessagesLengthRef.current;
        prevMessagesLengthRef.current = messages.length;

        // On first non-empty mount, Virtuoso is already positioned via initialTopMostItemIndex.
        // Avoid triggering any additional scroll that could look like a "scroll down" animation.
        if (prevLen === 0) return;

        // Don't auto-scroll during initial mount; the initial-scroll effect handles that.
        if (!initialScrollDoneRef.current) return;

        // If user is not at the bottom, never pull them down.
        // Also don't auto-scroll during prepend loads.
        if (!isAtBottomRef.current || isLoadingMore) return;

        // Only react to actual growth.
        if (messages.length <= prevLen) return;

        const lastIndex = firstItemIndex + messages.length - 1;
        virtuosoRef.current?.scrollToIndex({ index: lastIndex, align: 'end', behavior: 'auto' });
    }, [messages.length, firstItemIndex, isLoadingMore]);

    if (isLoading && messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500">Loading messages...</p>
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return <EmptyState icon="💬" message="No messages yet. Start the conversation!" />;
    }

    if (initialTopMostItemIndexRef.current === null && messages.length > 0) {
        const lastIndex = firstItemIndex + messages.length - 1;
        initialTopMostItemIndexRef.current =
            typeof initialTopMostItemIndex === 'number'
                ? { index: initialTopMostItemIndex, align: 'end' }
                : (initialTopMostItemIndex ?? { index: lastIndex, align: 'end' });

        if (
            typeof initialTopMostItemIndexRef.current === 'object' &&
            initialTopMostItemIndexRef.current?.align === 'start'
        ) {
            isAtBottomRef.current = false;
            alignToBottomRef.current = false;
        } else {
            isAtBottomRef.current = true;
            alignToBottomRef.current = true;
        }
    }

    return (
        <div className="flex-1 min-h-0 bg-chat-bg">
            <Virtuoso
                ref={virtuosoRef}
                style={{ height: '100%' }}
                data={messages}
                firstItemIndex={firstItemIndex}
                initialTopMostItemIndex={
                    typeof initialTopMostItemIndexRef.current === 'number'
                        ? { index: initialTopMostItemIndexRef.current, align: 'end' }
                        : (initialTopMostItemIndexRef.current ?? 0)
                }
                alignToBottom={alignToBottomRef.current}
                computeItemKey={(_, message) => message.id}
                atBottomStateChange={(isAtBottom) => {
                    isAtBottomRef.current = isAtBottom;
                }}
                followOutput={(isAtBottom) => (isAtBottom ? 'auto' : false)}
                startReached={() => {
                    if (!initialScrollDoneRef.current) return;
                    if (!isLoadingMore && hasMore) {
                        onLoadOlder();
                    }
                }}
                components={{
                    Header: () =>
                        isLoadingMore ? (
                            <div className="sticky top-0 z-10 py-2 flex items-center justify-center bg-chat-bg/85 backdrop-blur">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 shadow-sm border border-black/5">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs text-gray-600">
                                        Loading older messages…
                                    </span>
                                </div>
                            </div>
                        ) : null,
                    Footer: () => <div className="h-4" />,
                }}
                itemContent={(_, message) => (
                    <div className="px-3 sm:px-4 py-1">
                        {unreadAnchorMessageId && message.id === unreadAnchorMessageId ? (
                            <div className="py-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-black/10" />
                                    <div className="text-xs font-medium text-gray-600 bg-white/70 border border-black/5 rounded-full px-3 py-1">
                                        Unread messages
                                    </div>
                                    <div className="h-px flex-1 bg-black/10" />
                                </div>
                            </div>
                        ) : null}
                        <MessageBubble
                            message={message}
                            isSent={message.sender_id === currentUserId}
                            onMediaLoad={scrollToBottomIfPinned}
                        />
                    </div>
                )}
            />
        </div>
    );
}
