import { useAuthStore } from '../../store/authStore';
import { ProjectSelector } from '../user/ProjectSelector';
import { UserList } from '../user/UserList';
import { useChatStore } from '../../store/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Button } from '../ui/Button';

interface SidebarProps {
    onSelectUser: (userId: string) => void;
}

export function Sidebar({ onSelectUser }: SidebarProps) {
    const { currentUserName } = useAuthStore();
    const { selectedProjectId } = useChatStore();
    const { disconnect } = useWebSocket();

    return (
        <div className="w-full md:w-[350px] bg-white border-r border-gray-200 flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="px-5 py-5 bg-gradient-to-r from-primary to-primary-dark text-white flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold mb-1">{currentUserName || 'Loading...'}</h2>
                    <p className="text-sm opacity-90">
                        {selectedProjectId ? 'Select a user' : 'Select a project'}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnect}
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
