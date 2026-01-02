import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { ProjectSelector } from '../user/ProjectSelector';
import { UserList } from '../user/UserList';

interface SidebarProps {
    onSelectUser: (userId: string) => void;
}

export function Sidebar({ onSelectUser }: SidebarProps) {
    const { currentUserName } = useAuthStore();
    const { selectedProjectId } = useChatStore();

    return (
        <div className="w-full md:w-88 bg-white border-r border-gray-200 flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 className="text-2xl font-bold text-gray-900 font-display">Messages</h2>
                <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                    {selectedProjectId ? 'Project' : 'Global'}
                </div>
            </div>

            {/* Project Selector */}
            <ProjectSelector />

            {/* User List */}
            <UserList onSelectUser={onSelectUser} />
        </div>
    );
}
