import { useState } from 'react';

interface RatingDisplayProps {
    rating: number;
    maxRating?: number;
    size?: 'sm' | 'md' | 'lg';
    showNumber?: boolean;
    reviewCount?: number;
    interactive?: boolean;
    onRate?: (rating: number) => void;
}

export function RatingDisplay({
    rating,
    maxRating = 5,
    size = 'md',
    showNumber = true,
    reviewCount,
    interactive = false,
    onRate,
}: RatingDisplayProps) {
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedRating, setSelectedRating] = useState(rating);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const textSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    const handleClick = (value: number) => {
        if (interactive && onRate) {
            setSelectedRating(value);
            onRate(value);
        }
    };

    const displayRating = interactive ? (hoverRating || selectedRating) : rating;

    return (
        <div className="flex items-center gap-1.5">
            {/* Stars */}
            <div className="flex items-center gap-0.5">
                {Array.from({ length: maxRating }).map((_, index) => {
                    const starValue = index + 1;
                    const isFilled = starValue <= Math.floor(displayRating);
                    const isHalf = starValue === Math.ceil(displayRating) && displayRating % 1 !== 0;

                    return (
                        <button
                            key={index}
                            type="button"
                            disabled={!interactive}
                            onClick={() => handleClick(starValue)}
                            onMouseEnter={() => interactive && setHoverRating(starValue)}
                            onMouseLeave={() => interactive && setHoverRating(0)}
                            className={`${sizeClasses[size]} ${interactive ? 'cursor-pointer hover:scale-110 smooth-transition' : 'cursor-default'
                                }`}
                        >
                            {isFilled ? (
                                <svg className="w-full h-full text-yellow-400 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            ) : isHalf ? (
                                <svg className="w-full h-full text-yellow-400" viewBox="0 0 24 24">
                                    <defs>
                                        <linearGradient id={`half-${index}`}>
                                            <stop offset="50%" stopColor="currentColor" className="fill-current" />
                                            <stop offset="50%" stopColor="currentColor" className="text-gray-300" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        fill={`url(#half-${index})`}
                                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                    />
                                </svg>
                            ) : (
                                <svg className="w-full h-full text-gray-300 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Rating Number */}
            {showNumber && (
                <span className={`${textSizes[size]} font-semibold text-gray-700`}>
                    {displayRating.toFixed(1)}
                </span>
            )}

            {/* Review Count */}
            {reviewCount !== undefined && (
                <span className={`${textSizes[size]} text-gray-500`}>
                    ({reviewCount.toLocaleString()})
                </span>
            )}
        </div>
    );
}

// Compact version for tight spaces
export function RatingBadge({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
    return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-sm font-semibold text-yellow-900">{rating.toFixed(1)}</span>
            {reviewCount !== undefined && (
                <span className="text-xs text-yellow-700">({reviewCount})</span>
            )}
        </div>
    );
}
