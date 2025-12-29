import { ChatHeader } from './ChatHeader';
import { MessageList } from '../chat/MessageList';
import { MessageInput } from '../chat/MessageInput';
import { TypingIndicator } from '../chat/TypingIndicator';
import { EmptyState } from '../ui/EmptyState';
import { useChat } from '../../hooks/useChat';
import { useChatStore } from '../../store/chatStore';

export function ChatArea() {
    const { selectedUserId } = useChatStore();
    const {
        messages,
        sendMessage,
        updateUploadProgress,
        sendTypingIndicator,
        // stopTypingIndicator,
        isLoadingHistory,
    } = useChat();

    if (!selectedUserId) {
        return (
            <div className="flex-1 bg-chat-bg">
                <EmptyState icon="💬" message="Select a user to start chatting" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-chat-bg">
            <ChatHeader />
            <MessageList messages={messages} isLoading={isLoadingHistory} />
            <TypingIndicator />
            <MessageInput
                onSendMessage={sendMessage}
                onUploadProgress={updateUploadProgress}
                onTyping={sendTypingIndicator}
                // onStopTyping={stopTypingIndicator}
                disabled={!selectedUserId}
            />
        </div>
    );
}
