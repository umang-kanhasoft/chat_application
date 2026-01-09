import { useEffect } from 'react';
import { useCallSignaling } from '../../hooks/useCallSignaling';
import { useChatStore } from '../../store/chatStore';
import { cn } from '../../utils/helpers';
import { CallOverlay } from '../call/CallOverlay';
import { ChatArea } from './ChatArea';
import { Sidebar } from './Sidebar';

interface ChatLayoutProps {
    onOpenMenu?: () => void;
}

export function ChatLayout({ onOpenMenu }: ChatLayoutProps) {
    const { setSelectedUser, projectUsers, selectedUserId } = useChatStore();

    useCallSignaling();

    const handleSelectUser = (userId: string) => {
        const user = projectUsers.find((u) => u.id === userId);
        setSelectedUser(userId, user || null);
    };

    useEffect(() => {
        const metaViewport = document.querySelector('meta[name="viewport"]');
        const originalContent = metaViewport?.getAttribute('content');

        if (metaViewport) {
            metaViewport.setAttribute(
                'content',
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content',
            );
        }

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';

        return () => {
            if (metaViewport && originalContent) {
                metaViewport.setAttribute('content', originalContent);
            }
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 flex bg-slate-100 overflow-hidden" style={{ height: '100dvh' }}>
            <div
                className={cn(
                    'h-full w-full md:w-88 md:flex md:shrink-0 overflow-hidden',
                    selectedUserId ? 'hidden md:flex' : 'flex',
                )}
            >
                <Sidebar onSelectUser={handleSelectUser} onOpenMenu={onOpenMenu} />
            </div>

            <div
                className={cn(
                    'h-full flex-1 min-w-0 overflow-hidden',
                    selectedUserId ? 'flex' : 'hidden md:flex',
                )}
            >
                <ChatArea />
            </div>

            <CallOverlay />
        </div>
    );
}
