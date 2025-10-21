import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const RatingPopup = ({ forwarderName, orderId, forwarderId, onRatingSubmitted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState({
    communication_and_responsiveness: 0,
    reliability_and_delivery_performance: 0,
    pricing_and_value: 0
  });
  const [comment, setComment] = useState('');

  const ratingCategories = [
    {
      key: 'communication_and_responsiveness',
      label: 'Communication & Responsiveness',
      description: 'How responsive and communicative was the freight forwarder throughout the process?'
    },
    {
      key: 'reliability_and_delivery_performance',
      label: 'Reliability & Delivery Performance',
      description: 'Was the delivery completed on time and handled reliably from start to finish?'
    },
    {
      key: 'pricing_and_value',
      label: 'Pricing & Value',
      description: 'Did the service provide good value for the price you paid?'
    }
  ];
  

  const handleStarClick = (category, rating) => {
    setRatings(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const handleSubmit = async () => {
    // Validate that all ratings are provided
    const allRated = Object.values(ratings).every(rating => rating > 0);
    if (!allRated) {
      toast.error('Please provide ratings for all categories');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/rate-forwarder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          forwarderId,
          ratingCategories: ratings,
          comment: comment.trim() || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit rating');
      }

      toast.success('Rating submitted successfully', {
        description: `Thank you for rating ${forwarderName}`
      });

      // Reset form
      setRatings({
        communication_and_responsiveness: 0,
        reliability_and_delivery_performance: 0,
        pricing_and_value: 0
      });
      setComment('');
      setIsOpen(false);

      // Notify parent component
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }

    } catch (error) {
      toast.error('Failed to submit rating', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ category, rating, onRatingChange }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(category, star)}
            className="p-1 transition-colors hover:scale-110"
            disabled={isSubmitting}
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        <span className="text-sm font-medium text-gray-700">
          {rating > 0 ? `${rating}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Star className="h-4 w-4" />
          Rate Forwarder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Rate {forwarderName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Categories */}
          <div className="space-y-6">
            {ratingCategories.map((category) => (
              <div key={category.key} className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">
                    {category.label}
                  </Label>
                  <p className="text-sm text-gray-600">
                    {category.description}
                  </p>
                </div>
                <StarRating
                  category={category.key}
                  rating={ratings[category.key]}
                  onRatingChange={handleStarClick}
                />
              </div>
            ))}
          </div>

          {/* Comment Section */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-base font-semibold">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this freight forwarder..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.values(ratings).some(rating => rating === 0)}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4" />
                  Submit Rating
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingPopup;
