import React from 'react';
import { Ship, Plane, Package, Box, Container } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const ShipmentTypeIcon = ({ type }) => {
    return type.toLowerCase() === 'sea' ? <Ship className="h-4 w-4" /> : <Plane className="h-4 w-4" />;
};
  
const LoadTypeIcon = ({ type }) => {
    return type.toLowerCase() === 'fcl' ? <Container className="h-4 w-4" /> : <Package className="h-4 w-4" />;
};
  
const StatusBadge = ({ status }) => {
    const statusColors = {
        open: 'bg-green-500',
        pending: 'bg-amber-500',
        closed: 'bg-neutral-500',
        cancelled: 'bg-red-500',
    };

    return (
        <Badge className={`${statusColors[status.toLowerCase()]} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
};

const QuoteStatusBadge = ({ status }) => {
  const statusColors = {
    active: 'bg-green-500',
    cancelled: 'bg-red-500',
    expired: 'bg-neutral-500',
    rejected: 'bg-neutral-500'
  };

  return (
    <Badge className={`${statusColors[status.toLowerCase()]} text-white`}>
      {status}
    </Badge>
  );
};

export { ShipmentTypeIcon, LoadTypeIcon, StatusBadge, QuoteStatusBadge };