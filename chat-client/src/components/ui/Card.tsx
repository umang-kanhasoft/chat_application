import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'outline';
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', hover = false, padding = 'md', children, ...props }, ref) => {
        const baseStyles = 'rounded-xl smooth-transition';

        const variants = {
            default: 'bg-white shadow-md border border-gray-200',
            glass: 'glass-white shadow-xl',
            outline: 'border-2 border-gray-300 bg-white/50',
        };

        const paddings = {
            none: '',
            sm: 'p-3',
            md: 'p-5',
            lg: 'p-8',
        };

        const hoverEffect = hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';

        return (
            <div
                ref={ref}
                className={cn(baseStyles, variants[variant], paddings[padding], hoverEffect, className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> { }

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div ref={ref} className={cn('mb-4', className)} {...props}>
                {children}
            </div>
        );
    }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> { }

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <h3 ref={ref} className={cn('text-xl font-bold text-gray-900', className)} {...props}>
                {children}
            </h3>
        );
    }
);

CardTitle.displayName = 'CardTitle';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> { }

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div ref={ref} className={cn('text-gray-600', className)} {...props}>
                {children}
            </div>
        );
    }
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> { }

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div ref={ref} className={cn('mt-4 pt-4 border-t border-gray-200', className)} {...props}>
                {children}
            </div>
        );
    }
);

CardFooter.displayName = 'CardFooter';
