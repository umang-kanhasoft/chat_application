import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useChatStore } from '../../store/chatStore';
import type { Message, User } from '../../types/chat.types';
import { cn } from '../../utils/helpers';

interface ReactionDetailsModalProps {
    reactions: {
        emoji: string;
        count: number;
        userIds: string[];
    }[];
    onClose: () => void;
    anchorRect?: DOMRect | null;
    currentUserId: string | null;
    message: Message;
    usersMap?: Map<string, User>; // Optional: if we have a global user map
}

export function ReactionDetailsModal({
    reactions,
    onClose,
    anchorRect,
    currentUserId,
    message,
    usersMap,
}: ReactionDetailsModalProps) {
    if (!reactions || reactions.length === 0) return null;

    const selectedUser = useChatStore((s) => s.selectedUser);

    const popoverRef = useRef<HTMLDivElement | null>(null);
    const [placement, setPlacement] = useState<'above' | 'below'>('below');
    const [computedStyle, setComputedStyle] = useState<CSSProperties | null>(null);

    const totalCount = useMemo(
        () => reactions.reduce((sum, r) => sum + (Number.isFinite(r.count) ? r.count : 0), 0),
        [reactions],
    );

    const reactionsSorted = useMemo(() => {
        return [...reactions]
            .filter((r) => Array.isArray(r.userIds) && r.userIds.length > 0 && (r.count ?? 0) > 0)
            .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    }, [reactions]);

    const userToEmojis = useMemo(() => {
        const map = new Map<string, string[]>();
        reactionsSorted.forEach((r) => {
            r.userIds.forEach((uid) => {
                const prev = map.get(uid) ?? [];
                if (!prev.includes(r.emoji)) prev.push(r.emoji);
                map.set(uid, prev);
            });
        });
        return map;
    }, [reactionsSorted]);

    const [selectedTab, setSelectedTab] = useState<'all' | string>('all');

    useEffect(() => {
        if (selectedTab === 'all') return;
        const exists = reactionsSorted.some((r) => r.emoji === selectedTab);
        if (!exists) setSelectedTab('all');
    }, [reactionsSorted, selectedTab]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        // Close the popover if the viewport changes (scroll/resize) so it doesn't drift away
        const onViewportChange = () => onClose();

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('resize', onViewportChange);
        window.addEventListener('scroll', onViewportChange, true);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('resize', onViewportChange);
            window.removeEventListener('scroll', onViewportChange, true);
        };
    }, [onClose]);

    // Calculate Position (measured + clamped so it never goes off-screen)
    const viewportPadding = 16;

    useLayoutEffect(() => {
        if (typeof window === 'undefined') return;
        if (!anchorRect) {
            setComputedStyle(null);
            return;
        }

        const el = popoverRef.current;
        if (!el) return;

        const vw =
            typeof document !== 'undefined'
                ? document.documentElement.clientWidth
                : window.innerWidth;
        const vh = window.innerHeight;

        // Measure current content size (use offset* to ignore scale transforms from initial animation)
        const pop = {
            width: el.offsetWidth,
            height: el.offsetHeight,
        };

        const availableAbove = anchorRect.top - viewportPadding;
        const availableBelow = vh - anchorRect.bottom - viewportPadding;
        const shouldShowBelow = pop.height <= availableBelow || availableBelow >= availableAbove;

        const desiredTop = shouldShowBelow
            ? anchorRect.bottom + 10
            : anchorRect.top - 10 - pop.height;
        const desiredLeft = anchorRect.left + anchorRect.width / 2 - pop.width / 2;

        const clampedTop = Math.min(
            Math.max(desiredTop, viewportPadding),
            Math.max(viewportPadding, vh - viewportPadding - pop.height),
        );
        const clampedLeft = Math.min(
            Math.max(desiredLeft, viewportPadding),
            Math.max(viewportPadding, vw - viewportPadding - pop.width),
        );

        setPlacement(shouldShowBelow ? 'below' : 'above');
        setComputedStyle({
            position: 'fixed',
            top: clampedTop,
            left: clampedLeft,
            transform: 'none',
        });
    }, [anchorRect, selectedTab, reactionsSorted.length, viewportPadding]);

    const resolveUserName = (uid: string) => {
        if (uid === currentUserId) return 'You';
        const mapped = usersMap?.get(uid)?.name;
        if (mapped) return mapped;
        if (selectedUser?.id === uid) return selectedUser.name;
        if (message.sender_id === uid) return message.sender?.name || 'User';
        return 'User';
    };

    const initialsFor = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return '?';
        const parts = trimmed.split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] ?? '?';
        const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
        return (first + second).toUpperCase();
    };

    const tabs = useMemo(() => {
        return [
            { key: 'all', label: 'All', count: totalCount },
            ...reactionsSorted.map((r) => ({ key: r.emoji, label: r.emoji, count: r.count })),
        ];
    }, [reactionsSorted, totalCount]);

    const usersForSelected = useMemo(() => {
        if (selectedTab === 'all') {
            const items = Array.from(userToEmojis.entries()).map(([uid, emojis]) => ({
                uid,
                emojis,
            }));

            items.sort((a, b) => {
                if (a.uid === currentUserId) return -1;
                if (b.uid === currentUserId) return 1;
                const an = resolveUserName(a.uid);
                const bn = resolveUserName(b.uid);
                return an.localeCompare(bn);
            });

            return items;
        }

        const reaction = reactionsSorted.find((r) => r.emoji === selectedTab);
        const ids = reaction?.userIds ?? [];
        const items = ids.map((uid) => ({ uid, emojis: [selectedTab] }));
        items.sort((a, b) => {
            if (a.uid === currentUserId) return -1;
            if (b.uid === currentUserId) return 1;
            const an = resolveUserName(a.uid);
            const bn = resolveUserName(b.uid);
            return an.localeCompare(bn);
        });
        return items;
    }, [currentUserId, reactionsSorted, resolveUserName, selectedTab, userToEmojis]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50" onClick={onClose}>
                {/* Transparent backdrop to catch clicks */}

                <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, scale: 0.9, y: placement === 'below' ? -10 : 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: placement === 'below' ? -10 : 10 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                    style={computedStyle ?? { opacity: 0 }} // Hide until computed
                    className={cn(
                        'bg-white rounded-2xl shadow-2xl border border-black/10 w-64 max-w-[calc(100vw-2rem)] overflow-hidden',
                        placement === 'below' ? 'origin-top' : 'origin-bottom',
                    )}
                >
                    <div className="px-2 pt-2">
                        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap p-0.5">
                            {tabs.map((t) => {
                                const active = selectedTab === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => setSelectedTab(t.key)}
                                        className={cn(
                                            'h-6 px-2.5 rounded-full text-[11px] font-medium flex items-center gap-1 border transition-all',
                                            active
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                                : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                                        )}
                                    >
                                        <span className="leading-none">
                                            {t.label !== 'All' ? t.label : 'All'}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-[9px] leading-none opacity-80',
                                                active ? 'text-white' : 'text-gray-500',
                                            )}
                                        >
                                            {t.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-2 border-t border-gray-100/50" />

                    <div className="max-h-[35vh] min-h-12.5 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200">
                        {usersForSelected.map((item) => {
                            const name = resolveUserName(item.uid);
                            return (
                                <div
                                    key={item.uid}
                                    className="flex items-center justify-between gap-3 px-3 py-1.5 hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-700 shrink-0">
                                            {initialsFor(name)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[13px] text-gray-900 truncate">
                                                {name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-1">
                                        {item.emojis.slice(0, 3).map((e) => (
                                            <span key={e} className="text-lg leading-none">
                                                {e}
                                            </span>
                                        ))}
                                        {item.emojis.length > 3 && (
                                            <span className="text-xs text-gray-500">
                                                +{item.emojis.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {usersForSelected.length === 0 && (
                            <div className="px-3 py-6 text-sm text-gray-500">No reactions</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body,
    );
}
