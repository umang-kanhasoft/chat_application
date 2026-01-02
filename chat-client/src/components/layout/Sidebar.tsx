import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { Button } from '../ui/Button';
import { ProjectSelector } from '../user/ProjectSelector';
import { UserList } from '../user/UserList';

interface SidebarProps {
    onSelectUser: (userId: string) => void;
}

export function Sidebar({ onSelectUser }: SidebarProps) {
    const { currentUserName } = useAuthStore();
    const { selectedProjectId } = useChatStore();
    const { logout } = useWebSocket();

    return (
        <div className="w-full md:w-88 bg-white border-r border-gray-200 flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="px-5 pb-5 pt-[calc(env(safe-area-inset-top)+20px)] bg-linear-to-r from-primary to-primary-dark text-white flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold mb-1">
                        {currentUserName || 'Loading...'}
                    </h2>
                    <p className="text-sm opacity-90">
                        {selectedProjectId ? 'Select a user' : 'Global chat'}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-white hover:bg-white/20 border border-white/30"
                >
                    Logout
                </Button>
            </div>

            {/* Project Selector */}
            <ProjectSelector />

            {/* User List */}
            <UserList onSelectUser={onSelectUser} />
        </div>
    );
}
