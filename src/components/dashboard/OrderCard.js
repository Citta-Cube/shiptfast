// @/components/dashboard/OrderCard.js
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Ship, Plane, Package, Box, Container } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
        <CardTitle className="text-sm font-medium">
          Order #{order.orderNumber}
        </CardTitle>
        <StatusBadge status={order.status} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">ID</span>
            <span className="text-sm font-medium">{order.id}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Shipment Date</span>
            <span className="text-sm font-medium">{order.shipmentDate}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ShipmentTypeIcon type={order.shipmentType} />
            <span className="text-sm font-medium">{order.shipmentType.toUpperCase()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <LoadTypeIcon type={order.loadType} />
            <span className="text-sm font-medium">{order.loadType}</span>
          </div>
          <div className="col-span-2 flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://flagcdn.com/w20/${order.originCountryCode.toLowerCase()}.png`} />
              <AvatarFallback>{order.originCountryCode}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{order.originPort}</span>
            <span className="text-sm">→</span>
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://flagcdn.com/w20/${order.destinationCountryCode.toLowerCase()}.png`} />
              <AvatarFallback>{order.destinationCountryCode}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{order.destinationPort}</span>
          </div>
          {order.status === 'open' && (
            <div className="col-span-2 flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground">Time Left for Bidding</span>
              <span className="text-sm font-medium">{order.timeLeft}</span>
            </div>
          )}
          <div className="col-span-2 flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Quotations Received</span>
            <span className="text-sm font-medium">{order.quotationsReceived}</span>
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