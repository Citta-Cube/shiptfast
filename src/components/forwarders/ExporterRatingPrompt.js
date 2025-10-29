"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Star } from 'lucide-react';
import ExporterRatingPopup from './ExporterRatingPopup';

// Shows rating UI for forwarders to rate exporters when final invoice is accepted
const ExporterRatingPrompt = ({ orderId, exporterName }) => {
  const [invoiceLocked, setInvoiceLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingRating, setExistingRating] = useState(null);
  const [checkingRating, setCheckingRating] = useState(false);

  const refreshRating = useCallback(async () => {
    setCheckingRating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/rating-status`);
      const data = await res.json();
      setExistingRating(data?.rating || null);
    } catch {
      setExistingRating(null);
    } finally {
      setCheckingRating(false);
    }
  }, [orderId]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const res = await fetch(`/api/invoices/${orderId}`);
        const data = await res.json();
        setInvoiceLocked(!!data?.invoice?.metadata?.locked);
      } catch {
        setInvoiceLocked(false);
      } finally {
        setLoading(false);
      }
      await refreshRating();
    };
    if (orderId) init();
    return () => { active = false; };
  }, [orderId, refreshRating]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="h-4 w-4" /> Checking rating availability…
      </div>
    );
  }

  if (!invoiceLocked) {
    return (
      <div className="text-xs text-muted-foreground">
        Rating will be available after the exporter accepts the final invoice.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {checkingRating ? (
        <div className="text-sm text-muted-foreground">Checking your rating…</div>
      ) : existingRating ? (
        <div className="text-sm">
          Your rating: <span className="font-medium">{Number(existingRating.average_score).toFixed(1)}/5</span>
        </div>
      ) : (
        <ExporterRatingPopup
          orderId={orderId}
          exporterName={exporterName}
          onRatingSubmitted={refreshRating}
        />
      )}
    </div>
  );
};

export default ExporterRatingPrompt;
