import { useChatStore } from '../../store/chatStore';
import { UserCard } from './UserCard';
import { EmptyState } from '../ui/EmptyState';

interface UserListProps {
    onSelectUser: (userId: string) => void;
}

export function UserList({ onSelectUser }: UserListProps) {
    const { projectUsers, selectedUserId } = useChatStore();

    if (projectUsers.length === 0) {
        return <EmptyState icon="👥" message="No users in this project" />;
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {projectUsers.map((user) => (
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
