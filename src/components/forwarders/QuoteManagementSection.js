'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, AlertTriangle, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, CalendarIcon, ArrowRightIcon } from 'lucide-react';
import { toast } from 'sonner';
import QuoteForm from './QuoteForm';
import { QuoteStatusBadge } from '@/components/ui/quote-status-badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, formatDistanceToNow } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Ship, Plane } from 'lucide-react';
import { cn } from "@/lib/utils";

const QuoteManagementSection = ({ 
  orderId, 
  forwarderId, 
  quotes = [], 
  shipmentType, 
  loadType,
  originPort,
  destinationPort,
  orderStatus
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedQuoteId, setExpandedQuoteId] = useState(null);
  const [openQuoteId, setOpenQuoteId] = useState(null);
  
  // Sort quotes by creation date (newest first)
  const sortedQuotes = [...quotes].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
  
  // Business Logic: New quotes can only be submitted when order status is OPEN
  const canSubmitNewQuote = orderStatus === 'OPEN';
  
  const handleOpenDialog = (quote = null) => {
    setSelectedQuote(quote);
    setDialogOpen(true);
  };
  
  const handleCancelQuote = async (quoteId) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/forwarders/quotes/${quoteId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Quote cancelled successfully', {
          description: 'Your quote has been cancelled.'
        });
        setOpenQuoteId(null);
      } else {
        toast.error('Failed to cancel quote', {
          description: data.error || 'An error occurred while cancelling the quote.'
        });
      }
    } catch (error) {
      toast.error('Failed to cancel quote', {
        description: 'An unexpected error occurred.'
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleExpand = (quoteId) => {
    setExpandedQuoteId(expandedQuoteId === quoteId ? null : quoteId);
  };
  
  // Format additional details for display
  const formatAdditionalDetails = (quote) => {
    if (!quote?.quote_details) return [];
    
    const details = [];
    const additionalDetails = { ...quote.quote_details };
    
    // Remove shipment-specific fields that we don't want to show in additional details
    const skipFields = ['containerCount', 'containerSize', 'minimumCBM', 'ratePerCBM', 
                       'volumeWeight', 'chargeableWeight'];
    skipFields.forEach(field => delete additionalDetails[field]);
    
    // Format each field
    Object.entries(additionalDetails).forEach(([key, value]) => {
      if (value) { // Only show non-empty values
        let formattedValue = value;
        
        // Add USD symbol for monetary values
        if (['DTHC', 'THC', 'FSC', 'SSC', 'demurrage', 'detention'].includes(key) ||
            key.toLowerCase().includes('fee')) {
          formattedValue = `$${value}`;
        }
        
        // Add days for time-related fields
        if (key.toLowerCase().includes('time')) {
          formattedValue = `${value} days`;
        }
        
        details.push({
          label: key.replace(/([A-Z])/g, ' $1').trim(), // Convert camelCase to Title Case
          value: formattedValue
        });
      }
    });
    
    return details;
  };

  // Format route details including transshipment ports
  const formatRouteDetails = (quote) => {
    const ports = [];
    
    // Add origin port
    if (originPort) {
      ports.push({
        name: typeof originPort === 'object' ? originPort.name : originPort,
        code: typeof originPort === 'object' ? originPort.port_code : null,
        type: 'origin'
      });
    }
    
    // Add transshipment ports in sequence
    if (quote.transshipment_ports && quote.transshipment_ports.length > 0) {
      const sortedPorts = [...quote.transshipment_ports]
        .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
      
      sortedPorts.forEach(tp => {
        ports.push({
          name: tp.port?.name || tp.portName,
          code: tp.port?.port_code || tp.portCode,
          type: 'transshipment'
        });
      });
    }
    
    // Add destination port
    if (destinationPort) {
      ports.push({
        name: typeof destinationPort === 'object' ? destinationPort.name : destinationPort,
        code: typeof destinationPort === 'object' ? destinationPort.port_code : null,
        type: 'destination'
      });
    }
    
    return ports;
  };

  // Render route visualization
  const renderRoute = (ports) => {
    if (!ports.length) return null;

    return (
      <div className="relative">
        {/* Route line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
        
        {/* Ports */}
        <div className="relative flex items-center justify-between gap-2 min-w-min">
          {ports.map((port, index) => (
            <div key={index} className="flex items-center flex-shrink-0">
              {/* Port Node */}
              <div className={cn(
                "relative z-10 flex items-center gap-2 px-3 py-2 rounded-lg border",
                port.type === 'origin' ? 'bg-primary/5 border-primary/20' :
                port.type === 'destination' ? 'bg-primary/5 border-primary/20' :
                'bg-card border-border'
              )}>
                {/* Port Icon and Code */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={port.code ? `https://flagcdn.com/w20/${port.code.slice(0, 2).toLowerCase()}.png` : undefined} 
                      alt={port.code?.slice(0, 2)} 
                    />
                    <AvatarFallback className="text-xs">{port.code?.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{port.code || 'N/A'}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {port.name}
                    </span>
                  </div>
                </div>

                {/* Port Type Indicator */}
                {shipmentType === 'AIR' ? (
                  <Plane className="h-4 w-4 text-blue-500" />
                ) : (
                  <Ship className="h-4 w-4 text-blue-500" />
                )}
              </div>

              {/* Arrow between ports */}
              {index < ports.length - 1 && (
                <div className="flex items-center px-2 z-20">
                  <div className="flex flex-col items-center">
                    <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                    {port.type === 'transshipment' && (
                      <span className="text-[10px] text-muted-foreground">
                        Stop {index}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'SELECTED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'EXPIRED':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };
  
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Quote Management</CardTitle>
        <Button 
          onClick={() => handleOpenDialog()} 
          disabled={!canSubmitNewQuote}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Quote
        </Button>
      </CardHeader>
      
      <CardContent>
        {sortedQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Quotes Submitted</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {orderStatus !== 'OPEN' 
                ? `Cannot submit quotes when order status is ${orderStatus}. Quotes can only be submitted when the order is OPEN.`
                : "You haven't submitted any quotes for this order yet."
              }
            </p>
            {canSubmitNewQuote && (
              <Button onClick={() => handleOpenDialog()}>Submit Quote</Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedQuotes.map((quote) => (
              <Collapsible 
                key={quote.id} 
                open={expandedQuoteId === quote.id}
                onOpenChange={() => toggleExpand(quote.id)}
                className="border rounded-lg overflow-hidden"
              >
                <div className="p-4 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {renderStatusIcon(quote.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">Quote #{quote.id.slice(0, 8)}</h3>
                        <QuoteStatusBadge status={quote.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {quote.status === 'ACTIVE' && (
                      <>
                        {/* Edit Quote - Only available when order status is PENDING */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(quote);
                          }}
                          disabled={orderStatus !== 'PENDING'}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        
                        {/* Cancel Quote - Only available when order status is OPEN */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              disabled={orderStatus !== 'OPEN'}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Quote</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this quote? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, keep quote</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelQuote(quote.id)}
                                disabled={isSubmitting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {isSubmitting ? 'Cancelling...' : 'Yes, cancel quote'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    
                    <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        {expandedQuoteId === quote.id ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                        }
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                
                <CollapsibleContent>
                  <div className="p-4 border-t bg-muted/30 space-y-6">
                    {/* Basic Quote Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Net Freight Cost</p>
                        <p className="font-semibold">${quote.net_freight_cost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                        <p className="font-semibold">{quote.estimated_time_days} days</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Validity Period</p>
                        <p className="font-semibold">{quote.validity_period_days} days</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valid Until</p>
                        <p className="font-semibold flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {format(new Date(new Date(quote.created_at).getTime() + quote.validity_period_days * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Route Details</h4>
                      <div className="bg-background rounded-lg p-4 overflow-x-auto">
                        <div className="min-w-[600px]">
                          {renderRoute(formatRouteDetails(quote))}
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {formatAdditionalDetails(quote).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-3">Additional Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {formatAdditionalDetails(quote).map((detail, index) => (
                            <div key={index} className="bg-background rounded-lg p-3">
                              <p className="text-sm text-muted-foreground">{detail.label}</p>
                              <p className="font-medium">{detail.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Notes Section */}
                    {quote.note && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Notes</h4>
                        <div className="bg-background rounded-lg p-3">
                          <p className="text-sm whitespace-pre-wrap">{quote.note}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Price Amendment History */}
                    {quote.quote_amendments && quote.quote_amendments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Price Amendment History</h4>
                        <div className="space-y-2">
                          {quote.quote_amendments.map((amendment, i) => (
                            <div key={i} className="flex items-center gap-2 bg-background rounded-lg p-3 text-sm">
                              <span className="text-muted-foreground">
                                {format(new Date(amendment.created_at), 'MMM d, yyyy')}
                              </span>
                              <span className="text-red-500 line-through">${amendment.previous_net_freight_cost.toLocaleString()}</span>
                              <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-green-500">${amendment.new_net_freight_cost.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
        
        {/* Multiple quotes enabled: no restriction notice */}
      </CardContent>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedQuote ? 'Update Quote' : 'New Quote'}</DialogTitle>
            <DialogDescription>
              {selectedQuote 
                ? 'Edit your existing quote. Only price changes will be tracked in amendments.' 
                : 'Submit a new quote for this order.'}
            </DialogDescription>
          </DialogHeader>
          
          <QuoteForm
            orderId={orderId}
            forwarderId={forwarderId}
            existingQuote={selectedQuote}
            shipmentType={shipmentType}
            loadType={loadType}
            originPort={originPort}
            destinationPort={destinationPort}
            onSuccess={() => {
              setDialogOpen(false);
              toast.success(selectedQuote ? 'Quote updated successfully' : 'Quote submitted successfully', {
                description: selectedQuote 
                  ? 'Your quote has been updated.'
                  : 'Your quote has been submitted and is now active.'
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default QuoteManagementSection; 