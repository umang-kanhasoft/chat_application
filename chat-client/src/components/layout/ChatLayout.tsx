import { useCallSignaling } from '../../hooks/useCallSignaling';
import { useChatStore } from '../../store/chatStore';
import { CallOverlay } from '../call/CallOverlay';
import { ChatArea } from './ChatArea';
import { Sidebar } from './Sidebar';
import { cn } from '../../utils/helpers';

export function ChatLayout() {
    const { setSelectedUser, projectUsers, selectedUserId } = useChatStore();

    useCallSignaling();

    const handleSelectUser = (userId: string) => {
        const user = projectUsers.find((u) => u.id === userId);
        setSelectedUser(userId, user || null);
    };

    return (
        <div className="h-dvh w-screen flex bg-gray-100 overflow-hidden">
            <div
                className={cn(
                    'h-full w-full md:w-88 md:flex md:shrink-0',
                    selectedUserId ? 'hidden md:flex' : 'flex',
                )}
            >
                <Sidebar onSelectUser={handleSelectUser} />
            </div>

            <div
                className={cn('h-full flex-1 min-w-0', selectedUserId ? 'flex' : 'hidden md:flex')}
            >
                <ChatArea />
            </div>

            <CallOverlay />
        </div>
    );
}
