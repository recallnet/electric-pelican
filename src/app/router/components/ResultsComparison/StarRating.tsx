/**
 * @file Star rating component
 * @description Interactive star rating for result evaluation
 */

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  onRate?: ((rating: number) => void) | undefined;
}

export function StarRating({ onRate }: StarRatingProps) {
  const [userRating, setUserRating] = useState<number>(0);

  const handleRating = (rating: number) => {
    setUserRating(rating);
    onRate?.(rating);
  };

  if (!onRate) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">Rate:</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRating(star)}
          className={`text-sm transition-colors ${
            star <= userRating ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
          }`}
        >
          <Star className="h-4 w-4" fill={star <= userRating ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}
