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
  const key = (status || '').toLowerCase()
  const statusColors = {
    open: 'bg-green-500',
    pending: 'bg-amber-500',
    closed: 'bg-neutral-500',
    cancelled: 'bg-red-500',
    reassign: 'bg-amber-600',
    voided: 'bg-red-600',
  };

  const label = key.charAt(0).toUpperCase() + key.slice(1)

  return (
    <Badge className={`${statusColors[key] || 'bg-neutral-400'} text-white`}>
      {label}
    </Badge>
  );
};

const QuoteStatusBadge = ({ status }) => {
  const key = (status || '').toLowerCase()
  const statusColors = {
    active: 'bg-green-500',
    cancelled: 'bg-red-500',
    expired: 'bg-neutral-500',
    rejected: 'bg-neutral-500',
    withdrawn: 'bg-amber-600',
    revoked: 'bg-red-700',
  };

  const label = key.toUpperCase()

  return (
    <Badge className={`${statusColors[key] || 'bg-neutral-400'} text-white`}>
      {label}
    </Badge>
  );
};

export { ShipmentTypeIcon, LoadTypeIcon, StatusBadge, QuoteStatusBadge };