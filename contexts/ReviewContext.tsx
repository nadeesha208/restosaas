import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { Review, User } from '../types';

interface DisplayReview extends Review {
    userName: string;
}

interface ReviewStats {
    average: number;
    count: number;
}

interface ReviewContextType {
    reviews: DisplayReview[];
    loading: boolean;
    error: Error | null;
    addReview: (review: Omit<Review, 'id' | 'restaurantId' | 'timestamp'>) => void;
    getReviewsByItemId: (itemId: string) => DisplayReview[];
    getReviewStatsByItemId: (itemId: string) => ReviewStats;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

interface ReviewProviderProps {
    children: ReactNode;
    restaurantId: string;
}

export const ReviewProvider: React.FC<ReviewProviderProps> = ({ children, restaurantId }) => {
    const [reviews, setReviews] = useState<DisplayReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/reviews?restaurantId=${restaurantId}`);
            if (!response.ok) throw new Error('Failed to fetch reviews');
            const data: DisplayReview[] = await response.json();
            setReviews(data);
        } catch (err: any) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        if (restaurantId) {
            fetchReviews();
        }
    }, [fetchReviews, restaurantId]);
    
    const addReview = useCallback(async (reviewData: Omit<Review, 'id' | 'restaurantId' | 'timestamp'>) => {
        try {
            const response = await fetch('/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...reviewData, restaurantId }),
            });
            if (!response.ok) throw new Error('Failed to add review');
            const newReviewWithUser = await response.json();
            // Add to list optimistically or refetch
            setReviews(prev => [newReviewWithUser, ...prev].sort((a,b) => b.timestamp - a.timestamp));
        } catch (err: any) {
            setError(err);
        }
    }, [restaurantId]);

    const getReviewsByItemId = useCallback((itemId: string) => {
        return reviews.filter(r => r.menuItemId === itemId);
    }, [reviews]);

    const getReviewStatsByItemId = useCallback((itemId: string): ReviewStats => {
        const itemReviews = reviews.filter(r => r.menuItemId === itemId);
        const count = itemReviews.length;
        if (count === 0) {
            return { average: 0, count: 0 };
        }
        const totalRating = itemReviews.reduce((sum, r) => sum + r.rating, 0);
        return {
            average: totalRating / count,
            count: count,
        };
    }, [reviews]);


    return (
        <ReviewContext.Provider value={{
            reviews,
            loading,
            error,
            addReview,
            getReviewsByItemId,
            getReviewStatsByItemId
        }}>
            {children}
        </ReviewContext.Provider>
    );
};

export const useReviews = (): ReviewContextType => {
    const context = useContext(ReviewContext);
    if (context === undefined) {
        throw new Error('useReviews must be used within a ReviewProvider');
    }
    return context;
};