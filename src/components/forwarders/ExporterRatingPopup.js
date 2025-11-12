"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ExporterRatingPopup = ({ orderId, exporterName, onRatingSubmitted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState({
    clarity_of_requirements: 0,
    payment_timeliness: 0,
    documentation_accuracy: 0
  });
  const [comment, setComment] = useState('');

  const categories = [
    {
      key: 'clarity_of_requirements',
      label: 'Clarity of Requirements',
      description: 'How clear and complete were the shipment requirements shared by the exporter?'
    },
    {
      key: 'payment_timeliness',
      label: 'Payment Timeliness',
      description: 'Were payments made on time as agreed?'
    },
    {
      key: 'documentation_accuracy',
      label: 'Documentation Accuracy',
      description: 'Were documents accurate and provided promptly when requested?'
    },
  ];

  const handleStarClick = (key, value) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const allRated = Object.values(ratings).every((r) => r > 0);
    if (!allRated) {
      toast.error('Please provide ratings for all categories');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/rate-exporter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratingCategories: ratings, comment: comment.trim() || null })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to submit rating');

      toast.success('Rating submitted successfully', {
        description: exporterName ? `Thank you for rating ${exporterName}` : undefined
      });
      setIsOpen(false);
      setRatings({ clarity_of_requirements: 0, payment_timeliness: 0, documentation_accuracy: 0 });
      setComment('');
      onRatingSubmitted?.();
    } catch (e) {
      toast.error('Failed to submit rating', { description: e.message });
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
              className={`h-6 w-6 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-200'}`}
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
          Rate Exporter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            {exporterName ? `Rate ${exporterName}` : 'Rate Exporter'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat.key} className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">{cat.label}</Label>
                  <p className="text-sm text-gray-600">{cat.description}</p>
                </div>
                <StarRating
                  category={cat.key}
                  rating={ratings[cat.key]}
                  onRatingChange={handleStarClick}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-base font-semibold">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this exporter..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.values(ratings).some((r) => r === 0)}
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

export default ExporterRatingPopup;
