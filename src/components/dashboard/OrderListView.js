import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { calculateTimeLeft, formatDate } from '@/lib/helpers/formatDate';
import { ShipmentTypeIcon, LoadTypeIcon, StatusBadge } from '@/components/dashboard/OrderMetadata';
import Link from 'next/link';

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
            <TableCell>{order.reference_number}</TableCell>
            <TableCell><StatusBadge status={order.status} /></TableCell>
            <TableCell>{formatDate(order.cargo_ready_date)}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <ShipmentTypeIcon type={order.shipment_type} />
                <LoadTypeIcon type={order.load_type} />
                <span>{order.shipment_type.toUpperCase()} - {order.load_type}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://flagcdn.com/w20/${order.origin_port.country_code.toLowerCase()}.png`} />
                  <AvatarFallback>{order.destination_port.country_code}</AvatarFallback>
                </Avatar>
                <span>{order.origin_port.port_code}</span>
                <span>→</span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://flagcdn.com/w20/${order.destination_port.country_code.toLowerCase()}.png`} />
                  <AvatarFallback>{order.destination_port.country_code}</AvatarFallback>
                </Avatar>
                <span>{order.destination_port.port_code}</span>
              </div>
            </TableCell>
            <TableCell>{order.status === 'OPEN' ? calculateTimeLeft(order.quotation_deadline) : '-'}</TableCell>
            <TableCell>{order.quote_count}</TableCell>
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