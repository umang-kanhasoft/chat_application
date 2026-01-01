import { cn, getUserInitials } from '../../utils/helpers';

interface AvatarProps {
    name: string;
    isOnline?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Avatar({ name, isOnline = false, size = 'md', className }: AvatarProps) {
    const sizes = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-11 h-11 text-lg',
        lg: 'w-14 h-14 text-xl',
    };

    const onlineDotSizes = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    return (
        <div className={cn('relative shrink-0', className)}>
            <div
                className={cn(
                    'rounded-full bg-linear-to-br from-primary to-primary-dark',
                    'flex items-center justify-center text-white font-semibold',
                    sizes[size]
                )}
            >
                {getUserInitials(name)}
            </div>
            {isOnline && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 bg-green-500 border-2 border-white rounded-full',
                        onlineDotSizes[size]
                    )}
                />
            )}
        </div>
    );
}
