import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, DollarSign, MapPin, Truck, Star, CalendarIcon, ArrowRightIcon, Ship, Plane } from "lucide-react";
import { format } from 'date-fns';
import RatingPopup from './RatingPopup';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import FinalInvoiceControls from '@/components/orders/FinalInvoiceControls';

const SelectedQuoteSection = ({ order, selectedQuote, userRole }) => {
  const [existingRating, setExistingRating] = useState(null);
  const [isCheckingRating, setIsCheckingRating] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkExistingRating = async () => {
      if (order.status === 'CLOSED' && order.exporter_id) {
        setIsCheckingRating(true);
        try {
          const response = await fetch(`/api/orders/${order.id}/rating-status`);
          if (response.ok) {
            const data = await response.json();
            setExistingRating(data.rating);
          }
        } catch (error) {
          console.error('Error checking existing rating:', error);
        } finally {
          setIsCheckingRating(false);
        }
      }
    };

    if (isClient) {
      checkExistingRating();
    }
  }, [order.id, order.status, order.exporter_id, isClient]);

  if (!selectedQuote) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    // Since selected quotes remain ACTIVE but are identified by order.selected_quote_id
    return 'bg-green-100 text-green-800 border-green-200';
  };

  // Format route details including transshipment ports (reused from QuoteManagementSection)
  const formatRouteDetails = (quote) => {
    const ports = [];
    
    // Add origin port
    if (order.origin_port) {
      ports.push({
        name: order.origin_port.name,
        code: order.origin_port.port_code,
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
    if (order.destination_port) {
      ports.push({
        name: order.destination_port.name,
        code: order.destination_port.port_code,
        type: 'destination'
      });
    }
    
    return ports;
  };

  // Render route visualization (reused from QuoteManagementSection)
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
                {order.shipment_type === 'AIR' ? (
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

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold text-green-500 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Selected Quote
        </CardTitle>
        <div className="flex items-center gap-3">
          <Badge className={`${getStatusColor(selectedQuote.status)} border`}>
            SELECTED
          </Badge>
          {/* Rating Button */}
          {isClient && order.status === 'CLOSED' && (
            <div>
              {isCheckingRating ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  Checking...
                </div>
              ) : existingRating ? (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{existingRating.average_score.toFixed(1)}/5</span>
                </div>
              ) : (
                <RatingPopup
                  forwarderName={selectedQuote.companies?.name || 'Unknown Forwarder'}
                  orderId={order.id}
                  forwarderId={selectedQuote.freight_forwarder_id}
                  onRatingSubmitted={() => {
                    // Refresh rating status
                    setExistingRating({ average_score: 5 }); // Temporary until we get actual data
                  }}
                />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-muted/30 space-y-6">
          {/* Final Invoice Controls */}
          <FinalInvoiceControls 
            order={order} 
            selectedQuote={selectedQuote} 
            userRole={userRole}
            forwarderCompanyOwnsSelected={false}
          />

          {/* Forwarder Info */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {selectedQuote.companies?.name || 'Unknown Forwarder'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Selected on {format(new Date(selectedQuote.updated_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Basic Quote Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Net Freight Cost</p>
              <p className="font-semibold">{formatCurrency(selectedQuote.net_freight_cost)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Delivery</p>
              <p className="font-semibold">{selectedQuote.estimated_time_days} days</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Validity Period</p>
              <p className="font-semibold">{selectedQuote.validity_period_days || 'N/A'} days</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valid Until</p>
              <p className="font-semibold flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {selectedQuote.validity_period_days ? 
                  format(new Date(new Date(selectedQuote.created_at).getTime() + selectedQuote.validity_period_days * 24 * 60 * 60 * 1000), 'MMM d, yyyy') : 
                  'N/A'
                }
              </p>
            </div>
          </div>

          {/* Route Details */}
          <div>
            <h4 className="text-sm font-medium mb-3">Route Details</h4>
            <div className="bg-background rounded-lg p-4 overflow-x-auto">
              <div className="min-w-[600px]">
                {renderRoute(formatRouteDetails(selectedQuote))}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {selectedQuote.note && (
            <div>
              <h4 className="text-sm font-medium mb-2">Notes</h4>
              <div className="bg-background rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{selectedQuote.note}</p>
              </div>
            </div>
          )}

          {/* Additional Details */}
          {selectedQuote.quote_details && Object.keys(selectedQuote.quote_details).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Additional Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(selectedQuote.quote_details).map(([key, value]) => {
                  // Skip shipment-specific fields that are already displayed elsewhere
                  if (["containerCount", "containerSize", "minimumCBM", "ratePerCBM", 
                      "volumeWeight", "chargeableWeight"].includes(key)) {
                    return null;
                  }
                  
                  if (!value) return null; // Only show non-empty values
                  
                  let formattedValue = value;
                  
                  // Add USD symbol for monetary values
                  if (['DTHC', 'THC', 'FSC', 'SSC', 'demurrage', 'detention', 'AWBFee', 
                      'handlingFee', 'screeningFee', 'pickupFee', 'deliveryFee', 
                      'consolidationFee', 'deconsolidationFee', 'originHandling', 
                      'destinationHandling'].includes(key) ||
                      key.toLowerCase().includes('fee')) {
                    formattedValue = `$${value}`;
                  }
                  
                  // Add days for time-related fields
                  if (key.toLowerCase().includes('time')) {
                    formattedValue = `${value} days`;
                  }
                  
                  return (
                    <div key={key} className="bg-background rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="font-medium">{formattedValue}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectedQuoteSection;
