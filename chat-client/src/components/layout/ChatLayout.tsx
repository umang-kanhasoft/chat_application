import { useCallSignaling } from '../../hooks/useCallSignaling';
import { useChatStore } from '../../store/chatStore';
import { CallOverlay } from '../call/CallOverlay';
import { ChatArea } from './ChatArea';
import { Sidebar } from './Sidebar';

export function ChatLayout() {
    const { setSelectedUser, projectUsers } = useChatStore();

    useCallSignaling();

    const handleSelectUser = (userId: string) => {
        const user = projectUsers.find((u) => u.id === userId);
        setSelectedUser(userId, user || null);
    };

    return (
        <div className="h-screen w-screen flex bg-gray-100">
            <Sidebar onSelectUser={handleSelectUser} />
            <ChatArea />
            <CallOverlay />
        </div>
    );
}
