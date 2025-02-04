// @/components/dashboard/OrderCard.js
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Ship, Plane, Package, Box, Container } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { calculateTimeLeft, formatDate } from '@/lib/helpers/formatDate';
import UrgentIndicator from './UrgentIndicator';
import Link from 'next/link';

const ShipmentTypeIcon = ({ type }) => {
  return type === 'sea' ? <Ship className="h-4 w-4" /> : <Plane className="h-4 w-4" />;
};

const LoadTypeIcon = ({ type }) => {
  return type === 'FCL' ? <Container className="h-4 w-4" /> : <Package className="h-4 w-4" />;
};

const StatusBadge = ({ status }) => {
  const statusColors = {
    open: 'bg-green-500',
    pending: 'bg-yellow-500',
    closed: 'bg-gray-500'
  };

  return (
    <Badge className={`${statusColors[status]} text-white`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

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
          <div className="col-span-2 flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Quotations Received</span>
            <span className="text-sm font-medium">{10}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/orders/${order.id}`} passHref>
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
      </CardFooter>
    </Card>
  );
};

export default OrderCard;