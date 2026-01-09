import { useMemo } from 'react';
import { useChatStore } from '../../store/chatStore';
import { EmptyState } from '../ui/EmptyState';
import { UserCard } from './UserCard';

interface UserListProps {
    onSelectUser: (userId: string) => void;
}

export function UserList({ onSelectUser }: UserListProps) {
    const { projectUsers, selectedUserId, selectedProjectId, getUnreadCount, getLastMessageAt } =
        useChatStore();

    const sortedUsers = useMemo(() => {
        const users = [...projectUsers];
        users.sort((a, b) => {
            const aLast = getLastMessageAt(a.id);
            const bLast = getLastMessageAt(b.id);
            if (aLast !== bLast) return bLast - aLast;

            const aUnread = getUnreadCount(a.id);
            const bUnread = getUnreadCount(b.id);

            const aHasUnread = aUnread > 0;
            const bHasUnread = bUnread > 0;
            if (aHasUnread !== bHasUnread) return bHasUnread ? 1 : -1;

            if (aUnread !== bUnread) return bUnread - aUnread;

            if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;

            return a.name.localeCompare(b.name);
        });
        return users;
    }, [projectUsers, getUnreadCount, getLastMessageAt]);

    if (projectUsers.length === 0) {
        return (
            <EmptyState
                icon="👥"
                message={selectedProjectId ? 'No users in this project' : 'No users found yet'}
            />
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {sortedUsers.map((user) => (
                <UserCard
                    key={user.id}
                    user={user}
                    isSelected={user.id === selectedUserId}
                    onClick={() => onSelectUser(user.id)}
                />
            ))}
        </div>
    );
}
