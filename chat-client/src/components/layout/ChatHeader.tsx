import { callService } from '../../services/call.service';
import { useCallStore } from '../../store/callStore';
import { useChatStore } from '../../store/chatStore';
import { useConnectionStore } from '../../store/connectionStore';
import { cn, formatLastSeen } from '../../utils/helpers';

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
        <div className="shrink-0 sticky top-0 z-20 px-3 sm:px-4 py-3.5 bg-[#008069] text-white flex items-center gap-3">
            <button
                type="button"
                onClick={() => setSelectedUser(null, null)}
                className="-ml-1 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors"
                aria-label="Back"
                title="Back"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m15 18-6-6 6-6" />
                </svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold text-lg">
                {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white text-base truncate">{selectedUser.name}</h3>
                <div className="text-xs text-white/90 truncate">
                    {typing
                        ? 'typing...'
                        : online
                          ? 'online'
                          : formatLastSeen(selectedUser.lastSeen)}
                </div>
            </div>

            <button
                type="button"
                onClick={() => callService.startCall(selectedUser.id, selectedUser.name)}
                disabled={!canStartCall}
                className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0',
                    canStartCall
                        ? 'hover:bg-white/10 text-white'
                        : 'text-white/40 cursor-not-allowed',
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
                    width="20"
                    height="20"
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

            <button
                type="button"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                aria-label="More options"
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
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                </svg>
            </button>
        </div>
    );
}
