import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

interface SkillBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'outline';
    removable?: boolean;
    onRemove?: () => void;
}

export const SkillBadge = forwardRef<HTMLSpanElement, SkillBadgeProps>(
    ({ className, variant = 'default', removable, onRemove, children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full smooth-transition';

        const variants = {
            default: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
            primary: 'gradient-primary text-white',
            success: 'bg-green-100 text-green-800 hover:bg-green-200',
            outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
        };

        return (
            <span
                ref={ref}
                className={cn(baseStyles, variants[variant], className)}
                {...props}
            >
                <span>{children}</span>
                {removable && onRemove && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="flex-shrink-0 hover:opacity-70 focus:outline-none"
                        aria-label="Remove"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                )}
            </span>
        );
    }
);

SkillBadge.displayName = 'SkillBadge';
