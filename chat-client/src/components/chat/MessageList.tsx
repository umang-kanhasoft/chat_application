import { useEffect, useRef } from 'react';
import type { Message } from '../../types/chat.types';
import { MessageBubble } from './MessageBubble';
import { EmptyState } from '../ui/EmptyState';
import { useAuthStore } from '../../store/authStore';

interface MessageListProps {
    messages: Message[];
    isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
    const { currentUserId } = useAuthStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages]);

    if (isLoading) {
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

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 py-3 bg-chat-bg"
            style={{ scrollBehavior: 'smooth' }}
        >
            <div className="flex flex-col">
                {messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        isSent={message.sender_id === currentUserId}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
