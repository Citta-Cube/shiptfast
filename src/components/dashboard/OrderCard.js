import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { calculateTimeLeft, formatDate } from '@/lib/helpers/formatDate';
import { ShipmentTypeIcon, LoadTypeIcon, StatusBadge } from '@/components/dashboard/OrderMetadata';
import UrgentIndicator from './UrgentIndicator';
import Link from 'next/link';

const OrderCard = ({ order }) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs text-muted-foreground">
          {order.id}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {order.isUrgent && <UrgentIndicator />}
          <StatusBadge status={order.status} />
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
          {order.status === 'OPEN' && (
            <div className="col-span-2 flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground">Time Left for Bidding</span>
              <span className="text-sm font-medium">{calculateTimeLeft(order.quotation_deadline)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex items-center justify-between mt-4">
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-muted-foreground">Quotations Received</span>
          <span className="text-sm font-medium">{order.quote_count}</span>
        </div>
        <Link href={`/orders/${order.id}`} passHref>
          <Button variant="secondary">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default OrderCard;