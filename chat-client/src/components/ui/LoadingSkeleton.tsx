import { cn } from '../../utils/helpers';

interface LoadingSkeletonProps {
    variant?: 'text' | 'card' | 'circle' | 'rectangle';
    width?: string;
    height?: string;
    className?: string;
    count?: number;
}

export function LoadingSkeleton({
    variant = 'text',
    width,
    height,
    className,
    count = 1
}: LoadingSkeletonProps) {
    const baseStyles = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';

    const variants = {
        text: 'h-4 rounded',
        card: 'h-48 rounded-xl',
        circle: 'rounded-full',
        rectangle: 'rounded-lg',
    };

    const skeletonElement = (
        <div
            className={cn(
                baseStyles,
                variants[variant],
                className
            )}
            style={{
                width: width || (variant === 'circle' ? height : undefined),
                height: height,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
        />
    );

    if (count === 1) {
        return skeletonElement;
    }

    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i}>{skeletonElement}</div>
            ))}
        </div>
    );
}

export function ProjectCardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-md">
            <LoadingSkeleton variant="text" height="24px" width="70%" />
            <div className="mt-3 space-y-2">
                <LoadingSkeleton variant="text" width="100%" />
                <LoadingSkeleton variant="text" width="90%" />
            </div>
            <div className="mt-4 flex gap-2">
                <LoadingSkeleton variant="rectangle" width="80px" height="28px" />
                <LoadingSkeleton variant="rectangle" width="80px" height="28px" />
                <LoadingSkeleton variant="rectangle" width="80px" height="28px" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <LoadingSkeleton variant="text" width="100px" />
                <LoadingSkeleton variant="rectangle" width="120px" height="40px" />
            </div>
        </div>
    );
}
