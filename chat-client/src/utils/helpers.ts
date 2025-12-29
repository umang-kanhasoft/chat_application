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
    minute: '2-digit'
  });
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    today.getDate() === checkDate.getDate() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getFullYear() === checkDate.getFullYear()
  );
}

/**
 * Format date separator
 */
export function formatDateSeparator(date: Date | string): string {
  const messageDate = new Date(date);

  if (isToday(messageDate)) {
    return 'Today';
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isToday(yesterday)) {
    return 'Yesterday';
  }

  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get status icon for message
 */
export function getStatusIcon(status: string): string {
  if (status === 'READ') return '✓✓';
  if (status === 'DELIVERED') return '✓✓';
  if (status === 'PENDING') return '🕒';
  return '✓';
}
