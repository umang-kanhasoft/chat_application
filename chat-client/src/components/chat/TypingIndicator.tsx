import { useChatStore } from '../../store/chatStore';

export function TypingIndicator() {
    const { selectedUserId, isUserTyping } = useChatStore();

    if (!selectedUserId || !isUserTyping(selectedUserId)) {
        return <div className="h-9" />;
    }

    return (
        <div className="px-6 py-2.5 text-sm text-primary italic">
            <span className="inline-flex items-center gap-1">
                Typing
                <span className="inline-flex gap-1">
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
            </span>
        </div>
    );
}
