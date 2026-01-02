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
        isLoadingHistory,
        isLoadingMoreHistory,
        loadOlderMessages,
        hasMoreHistory,
        firstItemIndex,
        forceScrollToBottomToken,
        initialTopMostItemIndex,
        unreadAnchorMessageId,
    } = useChat();

    if (!selectedUserId) {
        return (
            <div className="flex-1 bg-chat-bg">
                <EmptyState icon="💬" message="Select a user to start chatting" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col chat-wallpaper min-h-0">
            <ChatHeader />
            <MessageList
                key={selectedUserId}
                messages={messages}
                isLoading={isLoadingHistory}
                isLoadingMore={isLoadingMoreHistory}
                hasMore={hasMoreHistory}
                firstItemIndex={firstItemIndex}
                onLoadOlder={loadOlderMessages}
                forceScrollToBottomToken={forceScrollToBottomToken}
                initialTopMostItemIndex={initialTopMostItemIndex}
                unreadAnchorMessageId={unreadAnchorMessageId}
            />
            <TypingIndicator />
            <MessageInput
                onSendMessage={sendMessage}
                onUploadProgress={updateUploadProgress}
                onTyping={sendTypingIndicator}
                disabled={!selectedUserId}
            />
        </div>
    );
}
