import type { User } from '../../types/chat.types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { formatLastSeen } from '../../utils/helpers';
import { useConnectionStore } from '../../store/connectionStore';
import { useChatStore } from '../../store/chatStore';
import { cn } from '../../utils/helpers';

interface UserCardProps {
    user: User;
    isSelected: boolean;
    onClick: () => void;
}

export function UserCard({ user, isSelected, onClick }: UserCardProps) {
    const { isUserOnline } = useConnectionStore();
    const { getUnreadCount, isUserTyping } = useChatStore();
    const online = isUserOnline(user.id);
    const unreadCount = getUnreadCount(user.id);
    const typing = isUserTyping(user.id);

    return (
        <div
            onClick={onClick}
            className={cn(
                'px-5 py-4 border-b border-gray-100 cursor-pointer transition-colors',
                'flex items-center gap-3 relative',
                'hover:bg-gray-50 active:bg-gray-100',
                isSelected && 'bg-blue-50 border-l-4 border-l-primary',
            )}
        >
            <Avatar name={user.name} isOnline={online} size="md" />

            <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">{user.name}</div>
                <div
                    className={cn(
                        'text-xs',
                        typing
                            ? 'text-primary italic'
                            : online
                              ? 'text-green-600'
                              : 'text-gray-500',
                    )}
                >
                    {typing ? 'typing...' : online ? 'Online' : formatLastSeen(user.lastSeen)}
                </div>
            </div>

            {unreadCount > 0 && <Badge count={unreadCount} />}
        </div>
    );
}
