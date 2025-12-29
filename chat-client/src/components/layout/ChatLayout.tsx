import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { useChatStore } from '../../store/chatStore';

export function ChatLayout() {
    const { setSelectedUser, projectUsers } = useChatStore();

    const handleSelectUser = (userId: string) => {
        const user = projectUsers.find((u) => u.id === userId);
        setSelectedUser(userId, user || null);
    };

    return (
        <div className="h-screen w-screen flex bg-gray-100">
            <Sidebar onSelectUser={handleSelectUser} />
            <ChatArea />
        </div>
    );
}
