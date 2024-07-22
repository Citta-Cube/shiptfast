import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const OrderListView = ({ orders }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order #</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Shipment Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Route</TableHead>
          <TableHead>Time Left</TableHead>
          <TableHead>Quotations</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id} className={order.isUrgent ? 'bg-red-600 bg-opacity-20' : ''}>
            <TableCell>{order.orderNumber}</TableCell>
            <TableCell><StatusBadge status={order.status} /></TableCell>
            <TableCell>{order.shipmentDate}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <ShipmentTypeIcon type={order.shipmentType} />
                <LoadTypeIcon type={order.loadType} />
                <span>{order.shipmentType.toUpperCase()} - {order.loadType}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://flagcdn.com/w20/${order.originCountryCode.toLowerCase()}.png`} />
                  <AvatarFallback>{order.originCountryCode}</AvatarFallback>
                </Avatar>
                <span>{order.originPort}</span>
                <span>→</span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://flagcdn.com/w20/${order.destinationCountryCode.toLowerCase()}.png`} />
                  <AvatarFallback>{order.destinationCountryCode}</AvatarFallback>
                </Avatar>
                <span>{order.destinationPort}</span>
              </div>
            </TableCell>
            <TableCell>{order.status === 'open' ? order.timeLeft : '-'}</TableCell>
            <TableCell>{order.quotationsReceived}</TableCell>
            <TableCell>
              <Link href={`/orders/${order.id}`} passHref>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OrderListView;