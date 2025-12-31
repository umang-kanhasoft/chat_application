import { Avatar } from '../ui/Avatar';
import { useChatStore } from '../../store/chatStore';
import { useConnectionStore } from '../../store/connectionStore';
import { cn, formatLastSeen } from '../../utils/helpers';
import { useCallStore } from '../../store/callStore';
import { callService } from '../../services/call.service';

export function ChatHeader() {
    const { selectedUser, isUserTyping, setSelectedUser } = useChatStore();
    const { isUserOnline } = useConnectionStore();
    const { status: callStatus } = useCallStore();

    if (!selectedUser) {
        return null;
    }

    const online = isUserOnline(selectedUser.id);
    const typing = isUserTyping(selectedUser.id);
    const canStartCall = online && callStatus === 'IDLE';

    return (
        <div className="sticky top-0 z-20 px-4 md:px-6 pb-3.5 pt-[calc(env(safe-area-inset-top)+14px)] bg-white/90 backdrop-blur border-b border-black/10 flex items-center gap-2.5 shadow-sm">
            <button
                type="button"
                onClick={() => setSelectedUser(null, null)}
                className="md:hidden -ml-1 w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 active:bg-black/10 transition-colors"
                aria-label="Back"
                title="Back"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m15 18-6-6 6-6" />
                </svg>
            </button>
            <Avatar name={selectedUser.name} isOnline={online} size="md" />
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-base">{selectedUser.name}</h3>
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
                    {typing
                        ? 'typing...'
                        : online
                          ? 'Online'
                          : formatLastSeen(selectedUser.lastSeen)}
                </div>
            </div>

            <button
                type="button"
                onClick={() => callService.startCall(selectedUser.id, selectedUser.name)}
                disabled={!canStartCall}
                className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                    'border border-gray-200 shadow-sm',
                    canStartCall
                        ? 'bg-white hover:bg-gray-50 text-gray-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                )}
                title={
                    !online
                        ? 'User is offline'
                        : callStatus !== 'IDLE'
                          ? 'Already in a call'
                          : 'Start video call'
                }
                aria-label="Start video call"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m22 8-6 4 6 4V8Z" />
                    <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
                </svg>
            </button>
        </div>
    );
}
