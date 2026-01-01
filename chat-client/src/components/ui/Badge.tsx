import { cn } from '../../utils/helpers';

interface BadgeProps {
    count: number;
    max?: number;
    className?: string;
}

export function Badge({ count, max = 99, className }: BadgeProps) {
    if (count <= 0) return null;

    const displayCount = count > max ? `${max}+` : count;

    return (
        <span
            className={cn(
                'inline-flex items-center justify-center',
                'min-w-5 h-5 px-1.5',
                'bg-green-500 text-white text-xs font-semibold',
                'rounded-full',
                className
            )}
        >
            {displayCount}
        </span>
    );
}
