import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Get user initials from name
 */
export function getUserInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Format last seen timestamp
 */
export function formatLastSeen(lastSeen?: Date): string {
    if (!lastSeen) return 'Offline';

    const now = new Date();
    const diff = now.getTime() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return new Date(lastSeen).toLocaleDateString();
}

/**
 * Format message timestamp
 */
export function formatMessageTime(date: Date | string): string {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Get status icon for message
 */
export function getStatusIcon(status: string): string {
    if (status === 'PENDING') return '🕒';
    if (status === 'SENT') return '✓';
    if (status === 'DELIVERED') return '✓✓';
    if (status === 'READ') return '✓✓';
    return '✓';
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: string | Date, date2: string | Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

/**
 * Format date for separator (Today, Yesterday, Date)
 */
export function formatDateSeparator(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();

    if (isSameDay(d, now)) {
        return 'Today';
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameDay(d, yesterday)) {
        return 'Yesterday';
    }

    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
