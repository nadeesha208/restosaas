import React from 'react';

interface StarRatingProps {
    rating: number;
    setRating?: (rating: number) => void;
    size?: 'sm' | 'md' | 'lg';
}

const StarIcon: React.FC<{ filled: boolean, color: string, className: string, onClick?: () => void, onMouseEnter?: () => void, onMouseLeave?: () => void }> = 
({ filled, color, className, onClick, onMouseEnter, onMouseLeave }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
        viewBox="0 0 20 20" 
        fill={filled ? color : 'currentColor'}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, size = 'md' }) => {
    const [hoverRating, setHoverRating] = React.useState(0);

    const isInteractive = !!setRating;
    const starColor = 'text-yellow-400';
    const emptyStarColor = 'text-gray-300';
    
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-8 w-8',
    }

    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => {
                const displayRating = hoverRating > 0 ? hoverRating : rating;
                const isFilled = star <= displayRating;
                
                return (
                    <StarIcon
                        key={star}
                        filled={isFilled}
                        color={isFilled ? 'currentColor' : 'none'}
                        className={`${starColor} ${sizeClasses[size]} ${isInteractive ? 'cursor-pointer' : ''}`}
                        onClick={isInteractive ? () => setRating(star) : undefined}
                        onMouseEnter={isInteractive ? () => setHoverRating(star) : undefined}
                        onMouseLeave={isInteractive ? () => setHoverRating(0) : undefined}
                    />
                );
            })}
        </div>
    );
};

export default StarRating;
