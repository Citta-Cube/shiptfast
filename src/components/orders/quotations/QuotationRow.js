'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, StickyNote } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import StarRating from './StarRating';
import PriceHistoryDialog from './PriceHistoryDialog';
import { shipmentTypes } from '@/config/shipmentConfig';
import { QuoteStatusBadge } from '@/components/dashboard/OrderMetadata';
import TransitRoute from './TransitRoute';

const generatePriceHistory = (currentPrice, quoteId) => {
    const history = [];
    let price = currentPrice;
    const seed = quoteId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    for (let i = 3; i >= 0; i--) {
      history.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: Math.round(price * 100) / 100
      });
      const change = (Math.sin(seed + i) * 200) - 100;
      price += change;
      price = Math.max(price, 0);
    }
    return history;
};


const QuotationRow = ({ quotation, order, onSelectAgent, userMembership }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Prefer real amendment history if present
  let priceHistory = [];
  if (quotation.quote_amendments && Array.isArray(quotation.quote_amendments) && quotation.quote_amendments.length > 0) {
    // Sort by created_at ascending, and include the original price as the first entry
    const amendments = [...quotation.quote_amendments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    // The original price is the price before the first amendment
    const originalPrice = amendments[0].old_price;
    const originalDate = amendments[0].created_at ? new Date(new Date(amendments[0].created_at).getTime() - 1000 * 60) : null;
    if (originalPrice && originalDate) {
      priceHistory.push({ date: originalDate.toISOString().split('T')[0], price: originalPrice });
    }
    amendments.forEach(amendment => {
      priceHistory.push({ date: amendment.created_at.split('T')[0], price: amendment.new_price });
    });
  } else {
    priceHistory = generatePriceHistory(quotation.net_freight_cost, quotation.id);
  }
  const previousPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2].price : quotation.net_freight_cost;
  const priceChange = ((quotation.net_freight_cost - previousPrice) / previousPrice) * 100;

  const handleSelectQuote = async () => {
    setIsSelecting(true);
    try {
      const response = await fetch(
        `/api/orders/${order.id}/quotes/${quotation.id}/select`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success('Quote selected successfully', {
        description: `You have selected ${quotation.companies.name} as your freight forwarder.`
      });
      
      onSelectAgent(quotation.freight_forwarder_id);
      setShowConfirmDialog(false);

      setTimeout(() => {
        router.refresh();
      }, 500);

    } catch (error) {
      toast.error('Failed to select quote', {
        description: error.message
      });
    } finally {
      setIsSelecting(false);
    }
  };

  const renderShipmentSpecificFields = () => {
    const shipmentType = shipmentTypes[order.shipment_type];
    if (!shipmentType) return null;

    return (
      <div className="grid grid-cols-4 gap-4 mt-4">
        {shipmentType.fields.map((field) => (
          <div key={field.key}>
            <p className="text-sm font-medium">{field.label}</p>
            <p>{field.format ? 
              field.format(quotation.quote_details[field.key]) : 
              quotation.quote_details[field.key]}</p>
          </div>
        ))}
        <div>
          <p className="text-sm font-medium">Container Type</p>
          <p>{order.order_details.containerType}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <TableRow className="group hover:bg-muted/50">
        <TableCell>
          <div className="font-medium">{quotation.companies.name}</div>
        </TableCell>
        <TableCell>
          <StarRating rating={quotation.companies.average_rating || 0} />
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">${quotation.net_freight_cost.toLocaleString()}</span>
            <PriceHistoryDialog 
              agentCompany={quotation.companies.name} 
              priceHistory={priceHistory}
              priceChange={priceChange}
            />
          </div>
        </TableCell>
        <TableCell>{quotation.estimated_time_days} days</TableCell>
        <TableCell>
          <TransitRoute 
            origin={order?.origin_port?.port_code}
            destination={order?.destination_port?.port_code}
            transshipmentPorts={quotation?.transshipment_ports}
          />
        </TableCell>
        <TableCell>{<QuoteStatusBadge status={quotation.status} />}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end space-x-2">
            {quotation.note && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <StickyNote className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <h3 className="text-lg font-semibold mb-2">Note</h3>
                  <p className="text-sm">{quotation.note}</p>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {((order.status === 'PENDING') ||
              (order.status === 'REASSIGN' && userMembership?.companies?.type === 'EXPORTER' && userMembership?.role === 'ADMIN' && userMembership?.companies?.id === order.exporter_id))
              && quotation.status === 'ACTIVE' && (
              <Button 
                onClick={() => setShowConfirmDialog(true)}
                size="sm"
                variant="default"
                disabled={isSelecting}
              >
                {isSelecting ? 'Selecting...' : 'Select Quote'}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Quote Selection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to select {quotation.companies.name} as your freight forwarder? 
              This action will reject all other quotes and cannot be undone.
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Freight Cost</p>
                    <p className="text-lg font-semibold">${quotation.net_freight_cost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estimated Time</p>
                    <p className="text-lg font-semibold">{quotation.estimated_time_days} days</p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSelectQuote}
              disabled={isSelecting}
            >
              {isSelecting ? 'Selecting...' : 'Confirm Selection'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {expanded && (
        <TableRow>
          <TableCell colSpan={7}>
            <div className="p-4 bg-muted rounded-md">
              {renderShipmentSpecificFields()}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default QuotationRow;
