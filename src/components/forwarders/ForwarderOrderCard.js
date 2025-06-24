import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { calculateTimeLeft, formatDate } from '@/lib/helpers/formatDate';
import { ShipmentTypeIcon, LoadTypeIcon, StatusBadge } from '@/components/dashboard/OrderMetadata';
import UrgentIndicator from '@/components/dashboard/UrgentIndicator';
import Link from 'next/link';
import { DollarSign } from 'lucide-react';

const ForwarderOrderCard = ({ order }) => {
  // Determine the quote status and action text
  const getQuoteStatusAndAction = () => {
    if (!order.is_submitted) {
      return {
        badge: null,
        actionText: 'Submit Quote',
        actionHref: `/forwarders/orders/${order.id}`
      };
    }
    
    if (order.quote_status) {
      switch (order.quote_status) {
        case 'quoted':
          return {
            badge: null,
            actionText: 'Edit Quote',
            actionHref: `/forwarders/orders/${order.id}`
          };
        case 'selected':
          return {
            badge: null,
            actionText: 'Manage Order',
            actionHref: `/forwarders/orders/${order.id}`
          };
        case 'rejected':
          return {
            badge: null,
            actionText: 'View Details',
            actionHref: `/forwarders/orders/${order.id}`
          };
        default:
          return {
            badge: null,
            actionText: 'View Details',
            actionHref: `/forwarders/orders/${order.id}`
          };
      }
    }
    
    return {
      badge: null,
      actionText: 'View Details',
      actionHref: `/forwarders/orders/${order.id}`
    };
  };
  
  const { badge, actionText, actionHref } = getQuoteStatusAndAction();

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
          
          {order.status === 'OPEN' && !order.is_submitted && (
            <div className="col-span-2 flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground">Time Left for Bidding</span>
              <span className="text-sm font-medium">{calculateTimeLeft(order.quotation_deadline)}</span>
            </div>
          )}
          
          {order.quote && (
            <div className="col-span-2 flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground">Your Quote</span>
              <span className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                {order.quote.net_freight_cost}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Link href={actionHref} passHref>
          <Button variant="outline" className="w-full">
            {actionText}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ForwarderOrderCard; 