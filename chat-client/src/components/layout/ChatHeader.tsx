import { Avatar } from '../ui/Avatar';
import { useChatStore } from '../../store/chatStore';
import { useConnectionStore } from '../../store/connectionStore';
import { formatLastSeen } from '../../utils/helpers';

export function ChatHeader() {
    const { selectedUser } = useChatStore();
    const { isUserOnline } = useConnectionStore();

    if (!selectedUser) {
        return null;
    }

    const online = isUserOnline(selectedUser.id);

    return (
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3 shadow-sm">
            <Avatar name={selectedUser.name} isOnline={online} size="md" />
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-base">{selectedUser.name}</h3>
                <p className={online ? 'text-green-600 text-sm' : 'text-gray-500 text-sm'}>
                    {online ? 'Online' : formatLastSeen(selectedUser.lastSeen)}
                </p>
            </div>
        </div>
    );
}
