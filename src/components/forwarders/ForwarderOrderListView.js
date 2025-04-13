import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { calculateTimeLeft, formatDate } from '@/lib/helpers/formatDate';
import { ShipmentTypeIcon, LoadTypeIcon, StatusBadge } from '@/components/dashboard/OrderMetadata';
import Link from 'next/link';
import { DollarSign } from 'lucide-react';

const ForwarderOrderListView = ({ orders }) => {
  // Determine the quote status, badge and action
  const getQuoteStatusAndAction = (order) => {    
    if (order.quote_status) {
      switch (order.quote_status) {
        case 'quoted':
          return {
            badge: <Badge className="bg-yellow-500">QUOTED</Badge>,
            actionText: 'Edit Quote',
            actionHref: `/forwarders/orders/${order.id}`
          };
        case 'pending':
            return {
              badge: <Badge className="bg-orange-500">PENDING</Badge>,
              actionText: 'Manage Order',
              actionHref: `/forwarders/orders/${order.id}`
          };
        case 'selected':
          return {
            badge: <Badge className="bg-green-500">SELECTED</Badge>,
            actionText: 'Manage Order',
            actionHref: `/forwarders/orders/${order.id}`
          };
        case 'rejected':
          return {
            badge: <Badge className="bg-red-500">REJECTED</Badge>,
            actionText: 'View Details',
            actionHref: `/forwarders/orders/${order.id}`
          };
        default:
          return {
            badge: <Badge className="bg-blue-500">OPEN</Badge>,
            actionText: 'View Details',
            actionHref: `/forwarders/orders/${order.id}`
          };
      }
    }
    
    return {
      badge: null,
      actionText: 'View',
      actionHref: `/forwarders/orders/${order.id}`
    };
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order #</TableHead>
          <TableHead>Order Status</TableHead>
          <TableHead>Exporter</TableHead>
          <TableHead>Shipment</TableHead>
          <TableHead>Route</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Quote Status</TableHead>
          <TableHead>Quote Value</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const { badge, actionText, actionHref } = getQuoteStatusAndAction(order);
          
          return (
            <TableRow 
              key={order.id} 
              className={`
                ${order.is_urgent ? 'bg-red-600 bg-opacity-20' : ''}
                ${order.quote_status === 'selected' ? 'bg-green-600 bg-opacity-20' : ''}
              `}
            >
              <TableCell>{order.reference_number}</TableCell>
              <TableCell><StatusBadge status={order.status} /></TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={order.exporter.iconurl || ''} />
                    <AvatarFallback>{order.exporter.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{order.exporter.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <ShipmentTypeIcon type={order.shipment_type} />
                  <LoadTypeIcon type={order.load_type} />
                  <span>{order.shipment_type.toUpperCase()} - {order.load_type}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span>{order.origin_port.port_code}</span>
                  <span>→</span>
                  <span>{order.destination_port.port_code}</span>
                </div>
              </TableCell>
              <TableCell>{formatDate(order.cargo_ready_date)}</TableCell>
              <TableCell>{badge}</TableCell>
              <TableCell>
                {order.quote ? (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {order.quote.net_freight_cost}
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell>
                <Link href={actionHref} passHref>
                  <Button variant="outline" size="sm">
                    {actionText}
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default ForwarderOrderListView; 