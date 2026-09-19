'use client';

import { useState } from 'react';
import styles from './Rating.module.css';
import { FaStar } from 'react-icons/fa';

interface RatingProps {
    productId: string;
    currentRating: number;
    ratingCount: number;
    onRatingSuccess: (data: { averageRating: number; ratingCount: number }) => void;
}

const Rating = ({ productId, currentRating, ratingCount, onRatingSuccess }: RatingProps) => {
    const [rating, setRating] = useState<number>(0);
    const [hover, setHover] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleRate = async (ratingValue: number) => {
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            const response = await fetch(`/api/products/${productId}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    rating: ratingValue, 
                    // NOTE: This is a placeholder. In a real app, you'd get the user ID from your auth system.
                    userId: `user_${Date.now()}` 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }
            
            setRating(ratingValue); // Lock the user's new rating
            setMessage('شكراً لك على تقييمك!');
            onRatingSuccess(data); // Update parent component state

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.ratingContainer}>
            <div className={styles.stars}>
                {[...Array(5)].map((_, index) => {
                    const ratingValue = index + 1;
                    return (
                        <label key={index}>
                            <input
                                type="radio"
                                name="rating"
                                value={ratingValue}
                                onClick={() => handleRate(ratingValue)}
                                disabled={isLoading || message !== null}
                            />
                            <FaStar
                                className={styles.star}
                                color={ratingValue <= (hover || rating || currentRating) ? '#ffc107' : '#e4e5e9'}
                                size={30}
                                onMouseEnter={() => !(isLoading || message) && setHover(ratingValue)}
                                onMouseLeave={() => !(isLoading || message) && setHover(0)}
                            />
                        </label>
                    );
                })}
            </div>
            <p className={styles.ratingText}> 
                ({ratingCount} تقييمات) 
            </p>
            {error && <p className={styles.errorMessage}>{error}</p>}
            {message && <p className={styles.successMessage}>{message}</p>}
        </div>
    );
};

export default Rating;
