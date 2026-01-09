import { ProjectSelector } from '../user/ProjectSelector';
import { UserList } from '../user/UserList';

interface SidebarProps {
    onSelectUser: (userId: string) => void;
    onOpenMenu?: () => void;
}

export function Sidebar({ onSelectUser, onOpenMenu }: SidebarProps) {
    return (
        <div className="w-full md:w-88 bg-white flex flex-col h-full">
            {/* Sidebar Header - WhatsApp Style */}
            <div className="px-4 py-4 bg-[#008069] text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenMenu}
                        className="md:hidden -ml-1 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                        aria-label="Menu"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <h2 className="text-xl font-medium">Chats</h2>
                </div>
            </div>

            {/* Project Selector */}
            <ProjectSelector />

            {/* User List */}
            <UserList onSelectUser={onSelectUser} />
        </div>
    );
}
