import React from 'react';
import { Star, StarHalf } from 'lucide-react';

const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <React.Fragment key={index}>
          {index < fullStars ? (
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
          ) : index === fullStars && hasHalfStar ? (
            <StarHalf className="w-4 h-4 text-yellow-400 fill-current" />
          ) : (
            <Star className="w-4 h-4 text-gray-300" />
          )}
        </React.Fragment>
      ))}
      <span className="ml-1 text-sm text-foreground">{rating.toFixed(1)}</span>
    </div>
  );
};

export default StarRating;