import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { calculateTimeLeft, formatDate } from '@/lib/helpers/formatDate';
import { ShipmentTypeIcon, LoadTypeIcon, StatusBadge } from '@/components/dashboard/OrderMetadata';
import UrgentIndicator from '@/components/dashboard/UrgentIndicator';
import Link from 'next/link';
import { DollarSign, Clock, Loader2 } from 'lucide-react';

const ForwarderOrderCard = ({ order }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = () => {
    setIsLoading(true);
    // The loading state will be reset when the page navigation occurs
    // or component unmounts
  };

  // Determine the quote status and action text
  const getQuoteStatusAndAction = () => {
    // If order is cancelled, button is enabled and navigates to details
    if (order.status === 'CANCELLED') {
      return {
        badge: null,
        actionText: 'Order Cancelled',
        actionHref: `/forwarders/orders/${order.id}`,
        disabled: false
      };
    }

    if (!order.is_submitted) {
      return {
        badge: null,
        actionText: 'Submit Quote',
        actionHref: `/forwarders/orders/${order.id}`,
        disabled: false
      };
    }
    
    if (order.quote_status) {
      switch (order.quote_status) {
        case 'quoted':
          return {
            badge: null,
            actionText: 'Edit Quote',
            actionHref: `/forwarders/orders/${order.id}`,
            disabled: false
          };
        case 'selected':
          return {
            badge: null,
            actionText: 'Manage Order',
            actionHref: `/forwarders/orders/${order.id}`,
            disabled: false
          };
        case 'rejected':
          return {
            badge: null,
            actionText: 'View Details',
            actionHref: `/forwarders/orders/${order.id}`,
            disabled: false
          };
        default:
          return {
            badge: null,
            actionText: 'View Details',
            actionHref: `/forwarders/orders/${order.id}`,
            disabled: false
          };
      }
    }
    
    return {
      badge: null,
      actionText: 'View Details',
      actionHref: `/forwarders/orders/${order.id}`,
      disabled: false
    };
  };
  
  const { badge, actionText, actionHref, disabled } = getQuoteStatusAndAction();

  // Determine what to show in footer
  const getFooterInfo = () => {
    // Show time remaining if order is open and not submitted
    if (order.status === 'OPEN' && !order.is_submitted) {
      return {
        type: 'time',
        label: 'Time Left for Bidding',
        value: calculateTimeLeft(order.quotation_deadline),
        icon: Clock
      };
    }
    
    // Show quote if available
    if (order.quote) {
      return {
        type: 'quote',
        label: 'Your Quote',
        value: order.quote.net_freight_cost,
        icon: DollarSign
      };
    }
    
    return null;
  };

  const footerInfo = getFooterInfo();

  return (
    <Card className={`w-full ${order.quote_status === 'selected' ? 'bg-green-600 bg-opacity-20' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs text-muted-foreground">
          {order.id}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {order.is_urgent && <UrgentIndicator />}
          <StatusBadge status={order.status} />
          {badge}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Order #</span>
            <span className="text-sm font-medium">{order.reference_number}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Shipment Date</span>
            <span className="text-sm font-medium">{formatDate(order.cargo_ready_date)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ShipmentTypeIcon type={order.shipment_type} />
            <span className="text-sm font-medium">{order.shipment_type.toUpperCase()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <LoadTypeIcon type={order.load_type} />
            <span className="text-sm font-medium">{order.load_type}</span>
          </div>
          
          <div className="col-span-2 flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={order.exporter.iconurl || ''} />
              <AvatarFallback>{order.exporter.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{order.exporter.name}</span>
          </div>
          
          <div className="col-span-2 flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://flagcdn.com/w20/${order.origin_port.country_code.toLowerCase()}.png`} />
              <AvatarFallback>{order.origin_port.country_code}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{order.origin_port.port_code}</span>
            <span className="text-sm">→</span>
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://flagcdn.com/w20/${order.destination_port.country_code.toLowerCase()}.png`} />
              <AvatarFallback>{order.destination_port.country_code}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{order.destination_port.port_code}</span>
          </div>
          
          <div className="col-span-2 flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Time Left for Bidding</span>
            <span className="text-sm font-medium">
              {order.status === 'OPEN'
                ? calculateTimeLeft(order.quotation_deadline)
                : 'Not Accepting Quotes'}
            </span>
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-4">
        <div className="flex w-full items-center justify-between">
          {/* Left side: footer info (if any) */}
          {footerInfo ? (
            <div className="flex items-center space-x-2">
              <footerInfo.icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{footerInfo.label}</span>
                <span className="text-sm font-medium">
                  {footerInfo.type === 'quote' && <DollarSign className="h-3 w-3 inline mr-1" />}
                  {footerInfo.value}
                </span>
              </div>
            </div>
          ) : <div />}

          {/* Right side: action button (always right-aligned) */}
          <Link href={actionHref} passHref>
            <Button 
              variant="secondary"
              className={`${footerInfo ? '' : 'w-full'} ${!footerInfo ? 'min-w-[120px]' : 'min-w-[100px]'} ml-auto`}
              disabled={isLoading}
              onClick={handleButtonClick}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                actionText
              )}
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ForwarderOrderCard;