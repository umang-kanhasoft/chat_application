import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/helpers';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, icon, iconPosition = 'left', fullWidth, children, disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg hover:-translate-y-0.5 focus:ring-primary glow',
            secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400',
            ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300',
            outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
            danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm gap-1.5',
            md: 'px-4 py-2 text-base gap-2',
            lg: 'px-6 py-3 text-lg gap-2',
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className)}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : icon && iconPosition === 'left' ? (
                    icon
                ) : null}
                {children}
                {!isLoading && icon && iconPosition === 'right' ? icon : null}
            </button>
        );
    }
);

Button.displayName = 'Button';
